/** Validated persistence boundary for bundled data, working copies and backups. */
import { clone } from './utils.js';
import { validateTripData } from './validator.js';
import { migrateTripData } from './migrations.js';

const KEYS = {
  data: 'ukrt:data:v1',
  backup: 'ukrt:backup:v1',
  preferences: 'ukrt:preferences:v1'
};

let bundledData = null;

/** Validate the deployment-owned registry before using it to construct a data URL. */
function getActiveVersion(registry) {
  if (!registry || registry.formatVersion !== 1 || !Array.isArray(registry.versions)) {
    throw new Error('The trip version registry is invalid.');
  }
  const versions = new Set();
  for (const entry of registry.versions) {
    if (!/^v\d+\.\d+$/.test(entry?.version || '') ||
        !/^versions\/trip-v\d+\.\d+\.json$/.test(entry?.file || '') ||
        versions.has(entry.version)) {
      throw new Error('The trip version registry contains an invalid entry.');
    }
    versions.add(entry.version);
  }
  const requestedVersion = registry.currentVersion || registry.activeVersion;
  if (!versions.has(requestedVersion)) throw new Error('The current trip version does not exist.');
  const active = registry.versions.find(entry => entry.version === requestedVersion);
  if (!active) throw new Error('The active trip version does not exist.');
  return active;
}

async function loadBundled() {
  const registryResponse = await fetch('../data/versions.json', { cache: 'no-store' });
  if (!registryResponse.ok) throw new Error('Could not load the trip version registry.');
  const active = getActiveVersion(await registryResponse.json());
  const dataResponse = await fetch(`../data/${active.file}`, { cache: 'no-store' });
  if (!dataResponse.ok) throw new Error(`Could not load bundled trip data ${active.version}.`);
  const rawData = await dataResponse.json();
  if (rawData.dataRevision !== active.dataRevision) throw new Error(`Bundled data ${active.version} has a mismatched revision.`);
  const data = migrateTripData(rawData, rawData);
  const result = validateTripData(data);
  if (!result.valid) throw new Error(`Bundled data is invalid: ${result.errors.join(' ')}`);
  bundledData = data;
  return data;
}

export const repository = {
  async initialise() {
    const defaults = await loadBundled();
    const saved = localStorage.getItem(KEYS.data);
    if (!saved) {
      this.save(defaults, false);
      return clone(defaults);
    }
    try {
      const original = JSON.parse(saved);
      const parsed = migrateTripData(original, defaults);
      const result = validateTripData(parsed);
      if (!result.valid) throw new Error(result.errors.join(' '));
      if (original.schemaVersion !== parsed.schemaVersion) this.save(parsed, true);
      return parsed;
    } catch (error) {
      localStorage.setItem(KEYS.backup, saved);
      this.save(defaults, false);
      return clone(defaults);
    }
  },

  save(data, createBackup = true) {
    const result = validateTripData(data);
    if (!result.valid) throw new Error(result.errors.join(' '));
    const current = localStorage.getItem(KEYS.data);
    if (createBackup && current) localStorage.setItem(KEYS.backup, current);
    data.lastUpdated = new Date().toISOString();
    localStorage.setItem(KEYS.data, JSON.stringify(data));
  },

  prepare(data) {
    if (!bundledData) throw new Error('Bundled data is not available for migration.');
    const prepared = migrateTripData(data, bundledData);
    const result = validateTripData(prepared);
    if (!result.valid) throw new Error(result.errors.join(' '));
    return prepared;
  },

  import(data) {
    try {
      const prepared = this.prepare(data);
      this.save(prepared, true);
      return { valid: true, errors: [], data: prepared };
    } catch (error) {
      return { valid: false, errors: [error.message], data: null };
    }
  },

  restoreBackup() {
    const backup = localStorage.getItem(KEYS.backup);
    if (!backup) return null;
    try {
      const data = this.prepare(JSON.parse(backup));
      this.save(data, false);
      return clone(data);
    } catch {
      return null;
    }
  },

  reset() {
    if (!bundledData) throw new Error('Bundled data is not available.');
    this.save(clone(bundledData), true);
    return clone(bundledData);
  },

  hasBackup() { return Boolean(localStorage.getItem(KEYS.backup)); },

  getPreferences() {
    try { return JSON.parse(localStorage.getItem(KEYS.preferences)) || {}; }
    catch { return {}; }
  },

  savePreferences(preferences) {
    localStorage.setItem(KEYS.preferences, JSON.stringify(preferences));
  }
};
