/** Structural and semantic validation for complete trip documents. */
import { CURRENT_SCHEMA_VERSION } from './migrations.js';

const REQUIRED_ARRAYS = ['trips', 'days', 'places', 'bookings', 'expenses', 'checklists', 'contacts', 'flights', 'carRentals', 'travelDocuments', 'weather', 'travelCompanions', 'notifications', 'travelModules', 'priceHistory', 'accommodationStops', 'hotelOptions'];
const REQUIRED_BUDGET_CATEGORIES = ['Accommodation', 'Flights', 'Car Rental', 'Fuel', 'Parking', 'Food', 'Shopping', 'Activities', 'Miscellaneous'];
const HOTEL_SCORE_KEYS = ['overall', 'value', 'comfort', 'parking', 'breakfast', 'kitchen', 'laundry', 'family', 'transport', 'loyaltyBenefits'];
const BOOKING_STATUSES = ['Researching', 'Ready to Book', 'Booked', 'Cancelled'];

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
  if (!data.activeTripId) errors.push('activeTripId is required.');
  if (data.trip && (!validDate(data.trip.startDate) || !validDate(data.trip.endDate) || data.trip.endDate < data.trip.startDate)) errors.push('Trip dates must be valid and end on or after the start date.');
  if (data.trip && (!Number.isFinite(Number(data.trip.budget)) || Number(data.trip.budget) < 0)) errors.push('trip.budget must be a non-negative number.');
  if (!data.integrations || typeof data.integrations !== 'object') errors.push('integrations is required.');
  if (data.integrations && typeof data.integrations.enabled !== 'boolean') errors.push('integrations.enabled must be a boolean.');
  if (data.integrations && (!data.integrations.defaultProviders || typeof data.integrations.defaultProviders !== 'object')) errors.push('integrations.defaultProviders is required.');
  REQUIRED_ARRAYS.forEach(key => {
    if (!Array.isArray(data[key])) errors.push(`${key} must be an array.`);
  });
  if (Array.isArray(data.trips)) {
    uniqueIds(data.trips, 'trips', errors);
    if (data.activeTripId && !data.trips.some(trip => trip.id === data.activeTripId)) errors.push('activeTripId must match a trip in trips.');
    data.trips.forEach((trip, index) => {
      if (!trip.name || !validDate(trip.startDate) || !validDate(trip.endDate)) errors.push(`trips[${index}] requires a name and valid dates.`);
      if (trip.endDate < trip.startDate) errors.push(`trips[${index}] endDate must be on or after startDate.`);
    });
  }
  if (!data.drivingGuide || !Array.isArray(data.drivingGuide.rules)) errors.push('drivingGuide.rules must be an array.');
  if (!data.tubePlan || !Array.isArray(data.tubePlan.journeys)) errors.push('tubePlan.journeys must be an array.');
  if (!Array.isArray(data.budgetCategories) || !data.budgetCategories.length) errors.push('budgetCategories must be a non-empty array.');
  REQUIRED_BUDGET_CATEGORIES.forEach(category => { if (!data.budgetCategories?.includes(category)) errors.push(`budgetCategories must include ${category}.`); });
  if (!data.currencyRates || typeof data.currencyRates !== 'object' || !data.currencyRates.base || typeof data.currencyRates.rates !== 'object') errors.push('currencyRates requires base and rates.');
  if (Array.isArray(data.checklists) && data.checklists.some(group => !['planning', 'packing'].includes(group.type))) errors.push('Every checklist requires a planning or packing type.');
  if (!Array.isArray(data.noteCategories) || !Array.isArray(data.notes)) errors.push('noteCategories and notes must be arrays.');
  if (Array.isArray(data.travelModules)) {
    uniqueIds(data.travelModules, 'travelModules', errors);
    data.travelModules.forEach((module, index) => {
      ['route', 'title', 'collection', 'icon', 'tone'].forEach(key => { if (!module[key]) errors.push(`travelModules[${index}].${key} is required.`); });
      if (module.collection && !Array.isArray(data[module.collection])) errors.push(`travelModules[${index}].collection must refer to an array.`);
    });
  }
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
  uniqueIds(data.flights || [], 'flights', errors);
  uniqueIds(data.carRentals || [], 'carRentals', errors);
  uniqueIds(data.travelDocuments || [], 'travelDocuments', errors);
  uniqueIds(data.weather || [], 'weather', errors);
  uniqueIds(data.travelCompanions || [], 'travelCompanions', errors);
  uniqueIds(data.notifications || [], 'notifications', errors);
  uniqueIds(data.priceHistory || [], 'priceHistory', errors);
  uniqueIds(data.accommodationStops || [], 'accommodationStops', errors);
  uniqueIds(data.hotelOptions || [], 'hotelOptions', errors);
  (data.expenses || []).forEach((expense, index) => { if (!validDate(expense.date) || !Number.isFinite(Number(expense.amount)) || Number(expense.amount) < 0) errors.push(`expenses[${index}] has an invalid date or amount.`); if (!data.budgetCategories?.includes(expense.category)) errors.push(`expenses[${index}].category is not configured.`); });
  (data.priceHistory || []).forEach((point, index) => { if (!point.itemId || !point.providerId || !point.currency || !Number.isFinite(Number(point.amount)) || Number(point.amount) < 0) errors.push(`priceHistory[${index}] requires itemId, providerId, currency and a non-negative amount.`); });
  const hotelOptionIds = new Set((data.hotelOptions || []).map(option => option.id));
  (data.accommodationStops || []).forEach((stop, index) => {
    if (!stop.location || !stop.dateLabel || !validDate(stop.startDate) || !validDate(stop.endDate)) errors.push(`accommodationStops[${index}] requires location and valid dates.`);
    if (!Number.isInteger(Number(stop.nights)) || Number(stop.nights) < 1) errors.push(`accommodationStops[${index}].nights must be at least 1.`);
    if (!Array.isArray(stop.optionIds) || !stop.optionIds.length) errors.push(`accommodationStops[${index}].optionIds must not be empty.`);
    (stop.optionIds || []).forEach(optionId => { if (!hotelOptionIds.has(optionId)) errors.push(`accommodationStops[${index}].optionIds includes unknown hotel option ${optionId}.`); });
    if (stop.primaryOptionId && !hotelOptionIds.has(stop.primaryOptionId)) errors.push(`accommodationStops[${index}].primaryOptionId does not exist.`);
  });
  (data.hotelOptions || []).forEach((option, index) => {
    if (!option.location || !option.name || !option.overnightPlaceId) errors.push(`hotelOptions[${index}] requires location, name and overnightPlaceId.`);
    if (option.overnightPlaceId && !placeIds.has(option.overnightPlaceId)) errors.push(`hotelOptions[${index}].overnightPlaceId does not exist.`);
    if (!Number.isFinite(Number(option.price || 0)) || Number(option.price || 0) < 0) errors.push(`hotelOptions[${index}].price must be non-negative.`);
    if (option.bookingStatus && !BOOKING_STATUSES.includes(option.bookingStatus)) errors.push(`hotelOptions[${index}].bookingStatus is invalid.`);
    ['parking', 'kitchen', 'laundry'].forEach(key => {
      if (option.features && typeof option.features[key] !== 'boolean') errors.push(`hotelOptions[${index}].features.${key} must be boolean.`);
    });
    ['familyFriendly', 'walkScore', 'myScore'].forEach(key => {
      const value = Number(option.features?.[key] || 0);
      if (!Number.isFinite(value) || value < 0 || value > 10) errors.push(`hotelOptions[${index}].features.${key} must be between 0 and 10.`);
    });
    HOTEL_SCORE_KEYS.forEach(key => {
      const score = Number(option.scores?.[key] || 0);
      if (!Number.isFinite(score) || score < 0 || score > 10) errors.push(`hotelOptions[${index}].scores.${key} must be between 0 and 10.`);
    });
  });
  (data.notes || []).forEach((note, index) => { if (!data.noteCategories?.includes(note.category)) errors.push(`notes[${index}].category is not configured.`); if (note.dayId && !dayIds.has(note.dayId)) errors.push(`notes[${index}].dayId does not exist.`); });
  if (!validWebUrl(data.drivingGuide?.sourceUrl) || !validWebUrl(data.tubePlan?.sourceUrl)) errors.push('Guide source URLs must use http or https.');
  return { valid: errors.length === 0, errors };
}
