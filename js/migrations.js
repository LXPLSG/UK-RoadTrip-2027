/** Sequential trip-document migrations that preserve existing local working copies. */
import { clone } from './utils.js';

export const CURRENT_SCHEMA_VERSION = 6;

export function migrateTripData(input, defaults) {
  const data = clone(input);
  if (!Number.isInteger(data.schemaVersion) || data.schemaVersion < 1) throw new Error('Trip schema version is missing or invalid.');
  if (data.schemaVersion > CURRENT_SCHEMA_VERSION) throw new Error(`Trip schema version ${data.schemaVersion} requires a newer app.`);
  if (data.schemaVersion === 1) {
    data.drivingGuide = clone(defaults.drivingGuide);
    data.schemaVersion = 2;
  }
  if (data.schemaVersion === 2) {
    data.tubePlan = clone(defaults.tubePlan);
    data.schemaVersion = 3;
  }
  if (data.schemaVersion === 3) {
    data.budgetCategories = clone(defaults.budgetCategories);
    data.schemaVersion = 4;
  }
  if (data.schemaVersion === 4) {
    const defaultTypes = new Map(defaults.checklists.map(group => [group.id, group.type]));
    data.checklists.forEach(group => { group.type = defaultTypes.get(group.id) || 'planning'; });
    data.schemaVersion = 5;
  }
  if (data.schemaVersion === 5) {
    data.noteCategories = clone(defaults.noteCategories);
    data.notes = clone(defaults.notes);
    data.schemaVersion = 6;
  }
  return data;
}
