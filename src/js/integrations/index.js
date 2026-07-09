/** Default future-integration registry for architecture and later provider wiring. */
import { ProviderRegistry } from './registry.js';
import {
  AirbnbAdapter,
  BookingComAdapter,
  CalendarAdapter,
  ExpediaAdapter,
  GoogleHotelsAdapter,
  GoogleMapsAdapter,
  GooglePlacesAdapter,
  HotelsComAdapter,
  OpenWeatherAdapter
} from './adapters.js';

export function createDefaultProviderRegistry() {
  return new ProviderRegistry()
    .register(new GooglePlacesAdapter())
    .register(new GoogleHotelsAdapter())
    .register(new BookingComAdapter())
    .register(new ExpediaAdapter())
    .register(new HotelsComAdapter())
    .register(new AirbnbAdapter())
    .register(new OpenWeatherAdapter())
    .register(new GoogleMapsAdapter())
    .register(new CalendarAdapter());
}

export const providerRegistry = createDefaultProviderRegistry();
