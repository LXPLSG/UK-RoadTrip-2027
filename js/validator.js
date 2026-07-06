/** Structural and semantic validation for complete trip documents. */
const REQUIRED_ARRAYS = ['days', 'places', 'bookings', 'expenses', 'checklists', 'contacts'];

export function validateTripData(data) {
  const errors = [];
  if (!data || typeof data !== 'object' || Array.isArray(data)) return { valid: false, errors: ['The JSON root must be an object.'] };
  if (data.schemaVersion !== 1) errors.push('schemaVersion must be 1.');
  if (!data.trip || typeof data.trip !== 'object') errors.push('trip is required.');
  ['id', 'name', 'startDate', 'endDate', 'homeCurrency'].forEach(key => {
    if (!data.trip?.[key]) errors.push(`trip.${key} is required.`);
  });
  REQUIRED_ARRAYS.forEach(key => {
    if (!Array.isArray(data[key])) errors.push(`${key} must be an array.`);
  });
  if (Array.isArray(data.days)) {
    const ids = new Set();
    data.days.forEach((day, index) => {
      if (!day.id || !day.date || !day.title) errors.push(`days[${index}] requires id, date and title.`);
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
