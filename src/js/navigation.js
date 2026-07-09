/** Central navigation registry and route-to-navigation matching rules. */
export const NAVIGATION_ITEMS = Object.freeze([
  { route: 'dashboard', label: 'Dashboard', icon: 'home', mobile: true },
  { route: 'today', label: 'Today', icon: 'calendar', mobile: true },
  { route: 'itinerary', label: 'Itinerary', icon: 'calendar', mobile: true },
  { route: 'places', label: 'Places', icon: 'pin', mobile: true },
  { route: 'accommodation', label: 'Accommodation', icon: 'bed', mobile: false },
  { route: 'restaurants', label: 'Restaurants', icon: 'restaurant', mobile: false },
  { route: 'flights', label: 'Flights', icon: 'plane', mobile: false },
  { route: 'car-rental', label: 'Car Rental', icon: 'car', mobile: false },
  { route: 'attractions', label: 'Attractions', icon: 'attraction', mobile: false },
  { route: 'driving', label: 'Driving guide', icon: 'car', mobile: false },
  { route: 'tube', label: 'Tube planner', icon: 'train', mobile: false },
  { route: 'budget', label: 'Budget', icon: 'wallet', mobile: false },
  { route: 'documents', label: 'Documents', icon: 'document', mobile: false },
  { route: 'weather', label: 'Weather', icon: 'weather', mobile: false },
  { route: 'checklist', label: 'Checklist', icon: 'check', mobile: false },
  { route: 'packing', label: 'Packing', icon: 'list', mobile: false },
  { route: 'notes', label: 'Notes', icon: 'note', mobile: false },
  { route: 'emergency-contacts', label: 'Emergency', icon: 'phone', mobile: false },
  { route: 'companions', label: 'Companions', icon: 'users', mobile: false },
  { route: 'settings', label: 'Settings', icon: 'settings', mobile: true }
]);

export function navigationRoute(routeName) {
  if (routeName === 'day') return 'itinerary';
  if (routeName === 'hotels') return 'accommodation';
  return routeName;
}

export function navigationItems({ mobile = false } = {}) {
  return NAVIGATION_ITEMS.filter(item => !mobile || item.mobile);
}
