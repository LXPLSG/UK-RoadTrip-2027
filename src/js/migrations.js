/** Sequential trip-document migrations that preserve existing local working copies. */
import { clone } from './utils.js';

export const CURRENT_SCHEMA_VERSION = 7;

export const PLATFORM_BUDGET_CATEGORIES = Object.freeze([
  'Accommodation',
  'Flights',
  'Car Rental',
  'Fuel',
  'Parking',
  'Food',
  'Shopping',
  'Activities',
  'Miscellaneous'
]);

function platformModules() {
  return [
    { id: 'restaurants', route: 'restaurants', title: 'Restaurants', eyebrow: 'Dining', collection: 'places', type: 'restaurant', icon: 'restaurant', tone: 'coral', summary: 'Shortlists, reservations and dining notes.' },
    { id: 'car-rental', route: 'car-rental', title: 'Car Rental', eyebrow: 'Transport', collection: 'carRentals', icon: 'car', tone: 'amber', summary: 'Rental options, pickup details, insurance and booking status.' },
    { id: 'flights', route: 'flights', title: 'Flights', eyebrow: 'Transport', collection: 'flights', icon: 'plane', tone: 'sky', summary: 'Flight options, booking references, terminals and timings.' },
    { id: 'documents', route: 'documents', title: 'Travel Documents', eyebrow: 'Documents', collection: 'travelDocuments', icon: 'document', tone: 'purple', summary: 'Passports, visas, licences, insurance and required paperwork.' },
    { id: 'packing', route: 'packing', title: 'Packing List', eyebrow: 'Preparation', collection: 'checklists', type: 'packing', icon: 'list', tone: 'green', summary: 'Packing groups and completion state.' },
    { id: 'expenses', route: 'expenses', title: 'Expenses', eyebrow: 'Money', collection: 'expenses', icon: 'wallet', tone: 'green', summary: 'Actual spend, forecast items and payment status.' },
    { id: 'weather', route: 'weather', title: 'Weather', eyebrow: 'Conditions', collection: 'weather', icon: 'weather', tone: 'sky', summary: 'Saved forecasts, weather alerts and packing implications.' },
    { id: 'travel-notes', route: 'travel-notes', title: 'Travel Notes', eyebrow: 'Notebook', collection: 'notes', icon: 'note', tone: 'purple', summary: 'Planning notes, reminders and decisions.' },
    { id: 'emergency-contacts', route: 'emergency-contacts', title: 'Emergency Contacts', eyebrow: 'Safety', collection: 'contacts', icon: 'phone', tone: 'coral', summary: 'Emergency numbers, insurers, embassies and key contacts.' },
    { id: 'companions', route: 'companions', title: 'Travel Companions', eyebrow: 'People', collection: 'travelCompanions', icon: 'users', tone: 'green', summary: 'Traveller profiles, roles, documents and preferences.' }
  ];
}

function applyPlatformDefaults(data, defaults = {}) {
  const fallbackTrip = defaults.trip || data.trip || {};
  const tripId = data.activeTripId || data.trip?.id || fallbackTrip.id || 'trip-1';
  data.activeTripId = tripId;
  data.trip = { ...fallbackTrip, ...(data.trip || {}), id: tripId };
  data.trips = Array.isArray(data.trips) && data.trips.length ? data.trips : [{
    id: tripId,
    name: data.trip.name || fallbackTrip.name || 'Untitled trip',
    startDate: data.trip.startDate || fallbackTrip.startDate || '',
    endDate: data.trip.endDate || fallbackTrip.endDate || '',
    homeCurrency: data.trip.homeCurrency || fallbackTrip.homeCurrency || 'GBP',
    status: 'planning'
  }];
  if (!data.trips.some(trip => trip.id === tripId)) {
    data.trips.unshift({
      id: tripId,
      name: data.trip.name,
      startDate: data.trip.startDate,
      endDate: data.trip.endDate,
      homeCurrency: data.trip.homeCurrency,
      status: 'planning'
    });
  }
  data.budgetCategories = clone(defaults.budgetCategories || PLATFORM_BUDGET_CATEGORIES);
  data.currencyRates = data.currencyRates || { base: data.trip.homeCurrency || 'GBP', rates: { [data.trip.homeCurrency || 'GBP']: 1 }, lastUpdated: data.lastUpdated || new Date().toISOString() };
  data.travelModules = Array.isArray(data.travelModules) && data.travelModules.length ? data.travelModules : platformModules();
  data.flights = Array.isArray(data.flights) ? data.flights : [];
  data.carRentals = Array.isArray(data.carRentals) ? data.carRentals : [];
  data.travelDocuments = Array.isArray(data.travelDocuments) ? data.travelDocuments : [];
  data.weather = Array.isArray(data.weather) ? data.weather : [];
  data.travelCompanions = Array.isArray(data.travelCompanions) ? data.travelCompanions : [];
  data.notifications = Array.isArray(data.notifications) ? data.notifications : [];
  return data;
}

export function migrateTripData(input, defaults) {
  const data = clone(input);
  if (!Number.isInteger(data.schemaVersion) || data.schemaVersion < 1) throw new Error('Trip schema version is missing or invalid.');
  if (data.schemaVersion > CURRENT_SCHEMA_VERSION) throw new Error(`Trip schema version ${data.schemaVersion} requires a newer app.`);
  if (data.schemaVersion === 1) {
    const defaultCountries = new Map(defaults.days.map(day => [day.id, day.country]));
    data.days.forEach(day => { day.country = day.country || defaultCountries.get(day.id) || 'United Kingdom'; });
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
  if (data.schemaVersion === 6) {
    applyPlatformDefaults(data, defaults);
    data.schemaVersion = 7;
  }
  if (data.schemaVersion === 7) applyPlatformDefaults(data, defaults);
  return data;
}
