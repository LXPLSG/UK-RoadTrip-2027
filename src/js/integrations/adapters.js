/** Architecture-only provider adapters; no network calls or secrets are used here. */
import { CAPABILITIES, emptyResult } from './contracts.js';

class PlannedAdapter {
  constructor({ id, name, capabilities, notes }) {
    this.id = id;
    this.name = name;
    this.capabilities = Object.freeze(capabilities);
    this.notes = notes;
  }

  supports(capability) {
    return this.capabilities.includes(capability);
  }

  searchPlaces(query, context = {}) {
    return Promise.resolve(emptyResult(this.id, CAPABILITIES.places, `${this.name} place search is not connected yet.`));
  }

  searchHotels(query, context = {}) {
    return Promise.resolve(emptyResult(this.id, CAPABILITIES.hotels, `${this.name} hotel search is not connected yet.`));
  }

  compareHotels(options = [], context = {}) {
    return Promise.resolve(emptyResult(this.id, CAPABILITIES.hotelComparison, `${this.name} hotel comparison is not connected yet.`));
  }

  trackBooking(reference, context = {}) {
    return Promise.resolve(emptyResult(this.id, CAPABILITIES.bookingTracker, `${this.name} booking tracking is not connected yet.`));
  }

  getWeather(location, context = {}) {
    return Promise.resolve(emptyResult(this.id, CAPABILITIES.weather, `${this.name} weather forecasts are not connected yet.`));
  }

  getRoute(route, context = {}) {
    return Promise.resolve(emptyResult(this.id, CAPABILITIES.maps, `${this.name} routing is not connected yet.`));
  }

  createCalendarEvent(event, context = {}) {
    return Promise.resolve(emptyResult(this.id, CAPABILITIES.calendar, `${this.name} calendar export is not connected yet.`));
  }

  getPriceHistory(item, context = {}) {
    return Promise.resolve(emptyResult(this.id, CAPABILITIES.priceHistory, `${this.name} price history is not connected yet.`));
  }
}

export class GooglePlacesAdapter extends PlannedAdapter {
  constructor() {
    super({ id: 'google-places', name: 'Google Places', capabilities: [CAPABILITIES.places], notes: 'Future place search, details and ratings provider.' });
  }
}

export class GoogleHotelsAdapter extends PlannedAdapter {
  constructor() {
    super({ id: 'google-hotels', name: 'Google Hotels', capabilities: [CAPABILITIES.hotels, CAPABILITIES.hotelComparison, CAPABILITIES.priceHistory], notes: 'Future hotel discovery and price comparison provider.' });
  }
}

export class BookingComAdapter extends PlannedAdapter {
  constructor() {
    super({ id: 'booking-com', name: 'Booking.com', capabilities: [CAPABILITIES.hotels, CAPABILITIES.hotelComparison, CAPABILITIES.bookingTracker, CAPABILITIES.priceHistory], notes: 'Future accommodation search and booking tracker provider.' });
  }
}

export class ExpediaAdapter extends PlannedAdapter {
  constructor() {
    super({ id: 'expedia', name: 'Expedia', capabilities: [CAPABILITIES.hotels, CAPABILITIES.hotelComparison, CAPABILITIES.bookingTracker, CAPABILITIES.priceHistory], notes: 'Future hotel package and booking tracker provider.' });
  }
}

export class HotelsComAdapter extends PlannedAdapter {
  constructor() {
    super({ id: 'hotels-com', name: 'Hotels.com', capabilities: [CAPABILITIES.hotels, CAPABILITIES.hotelComparison, CAPABILITIES.bookingTracker, CAPABILITIES.priceHistory], notes: 'Future hotel search and reward-booking provider.' });
  }
}

export class AirbnbAdapter extends PlannedAdapter {
  constructor() {
    super({ id: 'airbnb', name: 'Airbnb', capabilities: [CAPABILITIES.hotels, CAPABILITIES.hotelComparison, CAPABILITIES.priceHistory], notes: 'Future alternative-stay comparison provider.' });
  }
}

export class OpenWeatherAdapter extends PlannedAdapter {
  constructor() {
    super({ id: 'openweather', name: 'OpenWeather', capabilities: [CAPABILITIES.weather], notes: 'Future forecast and alert provider.' });
  }
}

export class GoogleMapsAdapter extends PlannedAdapter {
  constructor() {
    super({ id: 'google-maps', name: 'Google Maps', capabilities: [CAPABILITIES.maps], notes: 'Future route, distance, traffic and map provider.' });
  }
}

export class CalendarAdapter extends PlannedAdapter {
  constructor() {
    super({ id: 'calendar', name: 'Calendar', capabilities: [CAPABILITIES.calendar], notes: 'Future calendar export provider for local or cloud calendars.' });
  }
}
