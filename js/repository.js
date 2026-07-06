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

async function loadBundled() {
  const response = await fetch('./data/trip.json', { cache: 'no-store' });
  if (!response.ok) throw new Error('Could not load the bundled trip data.');
  const data = await response.json();
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

  import(data) {
    const result = validateTripData(data);
    if (!result.valid) return result;
    this.save(data, true);
    return { valid: true, errors: [] };
  },

  restoreBackup() {
    const backup = localStorage.getItem(KEYS.backup);
    if (!backup) return null;
    const data = JSON.parse(backup);
    const result = validateTripData(data);
    if (!result.valid) return null;
    this.save(data, false);
    return clone(data);
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
