/** Central navigation registry and route-to-navigation matching rules. */
export const NAVIGATION_ITEMS = Object.freeze([
  { route: 'today', label: 'Today', icon: 'home', mobile: true },
  { route: 'itinerary', label: 'Itinerary', icon: 'calendar', mobile: true },
  { route: 'places', label: 'Places', icon: 'pin', mobile: true },
  { route: 'budget', label: 'Budget', icon: 'wallet', mobile: true },
  { route: 'checklist', label: 'Checklist', icon: 'check', mobile: false },
  { route: 'settings', label: 'Settings', icon: 'settings', mobile: true }
]);

export function navigationRoute(routeName) {
  return routeName === 'day' ? 'itinerary' : routeName;
}

export function navigationItems({ mobile = false } = {}) {
  return NAVIGATION_ITEMS.filter(item => !mobile || item.mobile);
}
