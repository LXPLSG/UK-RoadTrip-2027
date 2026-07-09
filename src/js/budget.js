/** Shared budget engine for trip forecasts, actual spend and currency conversion. */
import { PLATFORM_BUDGET_CATEGORIES } from './migrations.js';

const PLACE_CATEGORY = Object.freeze({
  hotel: 'Accommodation',
  restaurant: 'Food',
  attraction: 'Activities',
  transport: 'Miscellaneous'
});

export const BUDGET_CATEGORIES = PLATFORM_BUDGET_CATEGORIES;

function asMoney(value) {
  const amount = Number(value || 0);
  return Number.isFinite(amount) && amount > 0 ? amount : 0;
}

export function normalizeBudgetCategory(category) {
  if (BUDGET_CATEGORIES.includes(category)) return category;
  if (category === 'Transport') return 'Miscellaneous';
  if (category === 'Other') return 'Miscellaneous';
  return 'Miscellaneous';
}

/** Build one ledger from actual expenses plus priced bookings/places. */
export function buildBudgetLedger(data) {
  const explicitExpensePlaceIds = new Set((data.expenses || []).map(expense => expense.placeId).filter(Boolean));
  const expenses = (data.expenses || []).map(expense => ({
    ...expense,
    category: normalizeBudgetCategory(expense.category),
    amount: asMoney(expense.amount),
    source: 'expense'
  }));
  const places = (data.places || [])
    .filter(place => asMoney(place.price) && !explicitExpensePlaceIds.has(place.id))
    .map(place => ({
      id: `place-${place.id}`,
      date: data.trip.startDate,
      category: PLACE_CATEGORY[place.type] || 'Miscellaneous',
      description: place.name,
      amount: asMoney(place.price),
      status: place.status || 'planned',
      placeId: place.id,
      source: 'estimate'
    }));
  const bookings = (data.bookings || [])
    .filter(booking => asMoney(booking.cost))
    .map(booking => ({
      id: `booking-${booking.id}`,
      date: booking.date,
      category: normalizeBudgetCategory(booking.type),
      description: booking.title,
      amount: asMoney(booking.cost),
      status: booking.status || 'planned',
      placeId: booking.placeId || '',
      source: 'booking'
    }));
  return [...expenses, ...places, ...bookings];
}

/** Return dashboard-ready totals and per-category rollups. */
export function calculateBudgetSummary(data) {
  const ledger = buildBudgetLedger(data);
  const totalBudget = asMoney(data.trip?.budget);
  const actualSpend = ledger.filter(item => item.status === 'paid' || item.source === 'expense').reduce((sum, item) => sum + item.amount, 0);
  const forecast = ledger.reduce((sum, item) => sum + item.amount, 0);
  const remaining = totalBudget - forecast;
  const travelerCount = Math.max(1, (data.trip?.travelers || []).length || (data.travelCompanions || []).length || 1);
  const byCategory = BUDGET_CATEGORIES.map(category => ({
    category,
    amount: ledger.filter(item => item.category === category).reduce((sum, item) => sum + item.amount, 0)
  }));
  return {
    ledger,
    totalBudget,
    actualSpend,
    forecast,
    remaining,
    perPerson: travelerCount ? forecast / travelerCount : forecast,
    travelerCount,
    byCategory
  };
}

/** Convert using bundled static rates; live providers can replace this boundary later. */
export function convertCurrency(amount, fromCurrency, toCurrency, currencyRates = {}) {
  const rates = currencyRates.rates || {};
  const from = rates[fromCurrency] || 1;
  const to = rates[toCurrency] || 1;
  return asMoney(amount) / from * to;
}
