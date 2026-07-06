/** Dependency-free production checks for data, migrations and cached asset inventory. */
import fs from 'node:fs';
import { validateTripData } from '../js/validator.js';
import { migrateTripData } from '../js/migrations.js';

const data = JSON.parse(fs.readFileSync('data/trip.json', 'utf8'));
JSON.parse(fs.readFileSync('data/trip.schema.json', 'utf8'));

const current = validateTripData(data);
if (!current.valid) throw new Error(current.errors.join('\n'));

for (const version of [1, 2, 3, 4, 5]) {
  const fixture = structuredClone(data);
  fixture.schemaVersion = version;
  if (version < 6) { delete fixture.noteCategories; delete fixture.notes; }
  if (version < 5) fixture.checklists.forEach(group => delete group.type);
  if (version < 4) delete fixture.budgetCategories;
  if (version < 3) delete fixture.tubePlan;
  if (version < 2) { delete fixture.drivingGuide; fixture.days.forEach(day => delete day.country); }
  const result = validateTripData(migrateTripData(fixture, data));
  if (!result.valid) throw new Error(`Migration from v${version} failed: ${result.errors.join(' ')}`);
}

const worker = fs.readFileSync('service-worker.js', 'utf8');
for (const [, path] of worker.matchAll(/'\.\/(.*?)'/g)) {
  if (path && !fs.existsSync(path)) throw new Error(`Cached asset is missing: ${path}`);
}

console.log(`Validated schema v${data.schemaVersion}, ${data.days.length} days and all migration paths.`);
