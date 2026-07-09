/** Accommodation-domain selectors for hotels, comparisons and booking tracking. */
import { calculateBudgetSummary } from './budget.js';

export function accommodationItems(data) {
  return (data.places || []).filter(place => place.type === 'hotel');
}

export function hotelOptionScore(option) {
  const scores = option.scores || {};
  const weights = { location: .28, parking: .22, value: .22, comfort: .18, flexibility: .10 };
  const weighted = Object.entries(weights).reduce((sum, [key, weight]) => sum + Number(scores[key] || 0) * weight, 0);
  return Math.round(weighted / 5 * 100);
}

export function hotelOptionsByLocation(data) {
  return (data.hotelOptions || []).reduce((groups, option) => {
    const key = option.location || 'Unassigned';
    groups[key] = groups[key] || [];
    groups[key].push({ ...option, score: hotelOptionScore(option) });
    groups[key].sort((a, b) => b.score - a.score || a.name.localeCompare(b.name));
    return groups;
  }, {});
}

export function hotelComparisonRows(data) {
  if (Array.isArray(data.hotelOptions) && data.hotelOptions.length) {
    return data.hotelOptions.map(option => ({
      id: option.id,
      name: option.name,
      city: option.location,
      status: option.status,
      price: Number(option.price || 0),
      nights: (data.days || []).filter(day => day.overnightPlaceId === option.overnightPlaceId).length,
      parking: `${option.scores?.parking || 0}/5`,
      reference: `${hotelOptionScore(option)}%`
    }));
  }
  return accommodationItems(data).map(hotel => {
    const nights = (data.days || []).filter(day => day.overnightPlaceId === hotel.id).length;
    return {
      id: hotel.id,
      name: hotel.name,
      city: hotel.city,
      status: hotel.status,
      price: Number(hotel.price || 0),
      nights,
      parking: hotel.parking || 'TBC',
      reference: hotel.bookingReference || 'TBC'
    };
  });
}

export function bookingTrackerItems(data) {
  const hotelBookings = accommodationItems(data).map(hotel => ({
    id: hotel.id,
    type: 'Accommodation',
    title: hotel.name,
    status: hotel.status,
    reference: hotel.bookingReference || '',
    amount: Number(hotel.price || 0)
  }));
  const explicitBookings = (data.bookings || []).map(booking => ({
    id: booking.id,
    type: booking.type,
    title: booking.title,
    status: booking.status,
    reference: booking.reference || '',
    amount: Number(booking.cost || 0)
  }));
  return [...hotelBookings, ...explicitBookings];
}

export function accommodationSummary(data) {
  const hotels = accommodationItems(data);
  const budget = calculateBudgetSummary(data);
  return {
    count: hotels.length,
    confirmed: hotels.filter(hotel => hotel.status === 'confirmed').length,
    totalEstimate: hotels.reduce((sum, hotel) => sum + Number(hotel.price || 0), 0),
    budgetForecast: budget.forecast
  };
}
