/** Structural and semantic validation for complete trip documents. */
import { CURRENT_SCHEMA_VERSION } from './migrations.js';

const REQUIRED_ARRAYS = ['days', 'places', 'bookings', 'expenses', 'checklists', 'contacts'];

export function validateTripData(data) {
  const errors = [];
  if (!data || typeof data !== 'object' || Array.isArray(data)) return { valid: false, errors: ['The JSON root must be an object.'] };
  if (data.schemaVersion !== CURRENT_SCHEMA_VERSION) errors.push(`schemaVersion must be ${CURRENT_SCHEMA_VERSION}.`);
  if (!data.trip || typeof data.trip !== 'object') errors.push('trip is required.');
  ['id', 'name', 'startDate', 'endDate', 'homeCurrency'].forEach(key => {
    if (!data.trip?.[key]) errors.push(`trip.${key} is required.`);
  });
  REQUIRED_ARRAYS.forEach(key => {
    if (!Array.isArray(data[key])) errors.push(`${key} must be an array.`);
  });
  if (!data.drivingGuide || !Array.isArray(data.drivingGuide.rules)) errors.push('drivingGuide.rules must be an array.');
  if (!data.tubePlan || !Array.isArray(data.tubePlan.journeys)) errors.push('tubePlan.journeys must be an array.');
  if (!Array.isArray(data.budgetCategories) || !data.budgetCategories.length) errors.push('budgetCategories must be a non-empty array.');
  if (Array.isArray(data.checklists) && data.checklists.some(group => !['planning', 'packing'].includes(group.type))) errors.push('Every checklist requires a planning or packing type.');
  if (!Array.isArray(data.noteCategories) || !Array.isArray(data.notes)) errors.push('noteCategories and notes must be arrays.');
  if (Array.isArray(data.days)) {
    const ids = new Set();
    data.days.forEach((day, index) => {
      if (!day.id || !day.date || !day.title || !day.region || !day.country) errors.push(`days[${index}] requires id, date, title, region and country.`);
      if (ids.has(day.id)) errors.push(`Duplicate day id: ${day.id}.`);
      ids.add(day.id);
      if (!Array.isArray(day.activities)) errors.push(`days[${index}].activities must be an array.`);
    });
  }
  if (Array.isArray(data.places)) {
    const ids = new Set();
    data.places.forEach((place, index) => {
      if (!place.id || !place.name || !place.type) errors.push(`places[${index}] requires id, name and type.`);
      if (ids.has(place.id)) errors.push(`Duplicate place id: ${place.id}.`);
      ids.add(place.id);
    });
  }
  return { valid: errors.length === 0, errors };
}
