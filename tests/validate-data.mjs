/** Dependency-free production checks for data, migrations and cached asset inventory. */
import fs from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { validateTripData } from '../src/js/validator.js';
import { migrateTripData } from '../src/js/migrations.js';

const VERSION_PATTERN = /^v\d+\.\d+$/;
const FILE_PATTERN = /^versions\/trip-v\d+\.\d+\.json$/;
const registry = JSON.parse(fs.readFileSync('data/versions.json', 'utf8'));
JSON.parse(fs.readFileSync('data/trip.schema.json', 'utf8'));
JSON.parse(fs.readFileSync('data/versions.schema.json', 'utf8'));

if (registry.formatVersion !== 1 || !Array.isArray(registry.versions) || !registry.versions.length) throw new Error('Trip version registry is invalid.');
const versionIds = new Set();
for (const entry of registry.versions) {
  if (!VERSION_PATTERN.test(entry.version) || !FILE_PATTERN.test(entry.file)) throw new Error(`Invalid trip version entry: ${entry.version || 'unknown'}.`);
  if (versionIds.has(entry.version)) throw new Error(`Duplicate trip version: ${entry.version}.`);
  if (!entry.file.includes(entry.version)) throw new Error(`Version filename does not match ${entry.version}.`);
  versionIds.add(entry.version);
  const snapshot = JSON.parse(fs.readFileSync(`data/${entry.file}`, 'utf8'));
  if (!Number.isInteger(snapshot.schemaVersion) || snapshot.schemaVersion < 1) throw new Error(`${entry.version} has an invalid schemaVersion.`);
  if (snapshot.dataRevision !== entry.dataRevision) throw new Error(`${entry.version} dataRevision does not match the registry.`);
}

const active = registry.versions.find(entry => entry.version === registry.activeVersion);
if (!active) throw new Error(`Active trip version ${registry.activeVersion} is not registered.`);
const currentEntry = registry.versions.find(entry => entry.version === (registry.currentVersion || registry.activeVersion));
if (!currentEntry) throw new Error(`Current trip version ${registry.currentVersion || registry.activeVersion} is not registered.`);
const data = JSON.parse(fs.readFileSync(`data/${currentEntry.file}`, 'utf8'));

const current = validateTripData(data);
if (!current.valid) throw new Error(current.errors.join('\n'));

for (const entry of registry.versions) {
  const snapshot = JSON.parse(fs.readFileSync(`data/${entry.file}`, 'utf8'));
  const migrated = migrateTripData(snapshot, data);
  const result = validateTripData(migrated);
  if (!result.valid) throw new Error(`${entry.version} does not migrate to the active schema: ${result.errors.join('\n')}`);
}

for (const version of [1, 2, 3, 4, 5, 6, 7]) {
  const fixture = structuredClone(data);
  fixture.schemaVersion = version;
  if (version < 8) {
    delete fixture.integrations;
    delete fixture.priceHistory;
  }
  if (version < 7) {
    delete fixture.activeTripId;
    delete fixture.trips;
    delete fixture.currencyRates;
    delete fixture.travelModules;
    delete fixture.flights;
    delete fixture.carRentals;
    delete fixture.travelDocuments;
    delete fixture.weather;
    delete fixture.travelCompanions;
    delete fixture.notifications;
  }
  if (version < 6) { delete fixture.noteCategories; delete fixture.notes; }
  if (version < 5) fixture.checklists.forEach(group => delete group.type);
  if (version < 4) delete fixture.budgetCategories;
  if (version < 3) delete fixture.tubePlan;
  if (version < 2) { delete fixture.drivingGuide; fixture.days.forEach(day => delete day.country); }
  const result = validateTripData(migrateTripData(fixture, data));
  if (!result.valid) throw new Error(`Migration from v${version} failed: ${result.errors.join(' ')}`);
}

const workerPath = 'src/service-worker.js';
const worker = fs.readFileSync(workerPath, 'utf8');
const workerUrl = pathToFileURL(`${process.cwd()}/${workerPath}`);
for (const [, path] of worker.matchAll(/'((?:\.\.?\/)[^']+)'/g)) {
  const resolved = fileURLToPath(new URL(path, workerUrl));
  if (path && !fs.existsSync(resolved)) throw new Error(`Cached asset is missing: ${path}`);
}

console.log(`Validated ${registry.versions.length} trip snapshot(s); active ${registry.activeVersion}, current ${currentEntry.version}, schema v${data.schemaVersion}, ${data.days.length} days and all migration paths.`);
