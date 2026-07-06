/** Sequential trip-document migrations that preserve existing local working copies. */
import { clone } from './utils.js';

export const CURRENT_SCHEMA_VERSION = 3;

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
  return data;
}
