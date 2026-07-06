/** Structural and semantic validation for complete trip documents. */
import { CURRENT_SCHEMA_VERSION } from './migrations.js';

const REQUIRED_ARRAYS = ['days', 'places', 'bookings', 'expenses', 'checklists', 'contacts'];

function validDate(value) {
  return /^\d{4}-\d{2}-\d{2}$/.test(value || '') && !Number.isNaN(new Date(`${value}T12:00:00Z`).getTime());
}

function validWebUrl(value) {
  if (!value) return true;
  try { return ['http:', 'https:'].includes(new URL(value).protocol); }
  catch { return false; }
}

function uniqueIds(items, path, errors) {
  const ids = new Set();
  items.forEach((item, index) => {
    if (!item?.id) errors.push(`${path}[${index}].id is required.`);
    else if (ids.has(item.id)) errors.push(`Duplicate ${path} id: ${item.id}.`);
    ids.add(item?.id);
  });
  return ids;
}

export function validateTripData(data) {
  const errors = [];
  if (!data || typeof data !== 'object' || Array.isArray(data)) return { valid: false, errors: ['The JSON root must be an object.'] };
  if (data.schemaVersion !== CURRENT_SCHEMA_VERSION) errors.push(`schemaVersion must be ${CURRENT_SCHEMA_VERSION}.`);
  if (!data.trip || typeof data.trip !== 'object') errors.push('trip is required.');
  ['id', 'name', 'startDate', 'endDate', 'homeCurrency'].forEach(key => {
    if (!data.trip?.[key]) errors.push(`trip.${key} is required.`);
  });
  if (data.trip && (!validDate(data.trip.startDate) || !validDate(data.trip.endDate) || data.trip.endDate < data.trip.startDate)) errors.push('Trip dates must be valid and end on or after the start date.');
  if (data.trip && (!Number.isFinite(Number(data.trip.budget)) || Number(data.trip.budget) < 0)) errors.push('trip.budget must be a non-negative number.');
  REQUIRED_ARRAYS.forEach(key => {
    if (!Array.isArray(data[key])) errors.push(`${key} must be an array.`);
  });
  if (!data.drivingGuide || !Array.isArray(data.drivingGuide.rules)) errors.push('drivingGuide.rules must be an array.');
  if (!data.tubePlan || !Array.isArray(data.tubePlan.journeys)) errors.push('tubePlan.journeys must be an array.');
  if (!Array.isArray(data.budgetCategories) || !data.budgetCategories.length) errors.push('budgetCategories must be a non-empty array.');
  if (Array.isArray(data.checklists) && data.checklists.some(group => !['planning', 'packing'].includes(group.type))) errors.push('Every checklist requires a planning or packing type.');
  if (!Array.isArray(data.noteCategories) || !Array.isArray(data.notes)) errors.push('noteCategories and notes must be arrays.');
  if (Array.isArray(data.days)) {
    uniqueIds(data.days, 'days', errors);
    const activityIds = new Set();
    data.days.forEach((day, index) => {
      if (!day.id || !day.date || !day.title || !day.region || !day.country) errors.push(`days[${index}] requires id, date, title, region and country.`);
      if (!validDate(day.date)) errors.push(`days[${index}].date is invalid.`);
      if (!Array.isArray(day.activities)) errors.push(`days[${index}].activities must be an array.`);
      else day.activities.forEach((activity, activityIndex) => { if (!activity.id || activityIds.has(activity.id)) errors.push(`Duplicate or missing activity id at days[${index}].activities[${activityIndex}].`); activityIds.add(activity.id); });
    });
  }
  if (Array.isArray(data.places)) {
    uniqueIds(data.places, 'places', errors);
    data.places.forEach((place, index) => {
      if (!place.id || !place.name || !place.type) errors.push(`places[${index}] requires id, name and type.`);
      if (!validWebUrl(place.website)) errors.push(`places[${index}].website must use http or https.`);
      if (!Number.isFinite(Number(place.price || 0)) || Number(place.price || 0) < 0) errors.push(`places[${index}].price must be non-negative.`);
    });
  }
  const placeIds = new Set((data.places || []).map(place => place.id));
  const dayIds = new Set((data.days || []).map(day => day.id));
  (data.days || []).forEach((day, index) => {
    if (day.overnightPlaceId && !placeIds.has(day.overnightPlaceId)) errors.push(`days[${index}].overnightPlaceId does not exist.`);
    (day.activities || []).forEach((activity, activityIndex) => { if (activity.placeId && !placeIds.has(activity.placeId)) errors.push(`days[${index}].activities[${activityIndex}].placeId does not exist.`); });
  });
  uniqueIds(data.bookings || [], 'bookings', errors);
  uniqueIds(data.expenses || [], 'expenses', errors);
  uniqueIds(data.checklists || [], 'checklists', errors);
  uniqueIds(data.notes || [], 'notes', errors);
  (data.expenses || []).forEach((expense, index) => { if (!validDate(expense.date) || !Number.isFinite(Number(expense.amount)) || Number(expense.amount) < 0) errors.push(`expenses[${index}] has an invalid date or amount.`); if (!data.budgetCategories?.includes(expense.category)) errors.push(`expenses[${index}].category is not configured.`); });
  (data.notes || []).forEach((note, index) => { if (!data.noteCategories?.includes(note.category)) errors.push(`notes[${index}].category is not configured.`); if (note.dayId && !dayIds.has(note.dayId)) errors.push(`notes[${index}].dayId does not exist.`); });
  if (!validWebUrl(data.drivingGuide?.sourceUrl) || !validWebUrl(data.tubePlan?.sourceUrl)) errors.push('Guide source URLs must use http or https.');
  return { valid: errors.length === 0, errors };
}
