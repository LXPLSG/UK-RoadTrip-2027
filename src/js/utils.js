/** Pure formatting, ID, download and form utilities used across the app. */
export const clone = value => structuredClone(value);

export function escapeHtml(value = '') {
  return String(value).replace(/[&<>'"]/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' })[char]);
}

export function formatDate(dateString, options = { weekday: 'short', day: 'numeric', month: 'short' }) {
  if (!dateString) return 'Not set';
  return new Intl.DateTimeFormat('en-GB', options).format(new Date(`${dateString}T12:00:00`));
}

export function formatDateRange(start, end) {
  const year = new Date(`${end}T12:00:00`).getFullYear();
  return `${formatDate(start, { day: 'numeric', month: 'short' })} – ${formatDate(end, { day: 'numeric', month: 'short', year: 'numeric' })}`;
}

export function formatMoney(amount = 0, currency = 'GBP') {
  return new Intl.NumberFormat('en-GB', { style: 'currency', currency, maximumFractionDigits: 0 }).format(Number(amount) || 0);
}

export function formatDuration(minutes = 0) {
  const value = Number(minutes) || 0;
  const hours = Math.floor(value / 60);
  const mins = value % 60;
  if (!hours) return `${mins} min`;
  return mins ? `${hours} hr ${mins} min` : `${hours} hr`;
}

export function titleCase(value = '') {
  return String(value).replace(/[-_]/g, ' ').replace(/\b\w/g, letter => letter.toUpperCase());
}

export function uid(prefix = 'item') {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}

export function daysUntil(dateString) {
  const target = new Date(`${dateString}T00:00:00`);
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  return Math.ceil((target - now) / 86400000);
}

export function downloadJson(data, filename) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

export function formObject(form) {
  return Object.fromEntries(new FormData(form).entries());
}

export function mapUrl(place) {
  const query = place.address && place.address !== 'TBC' ? `${place.name}, ${place.address}` : `${place.name}, ${place.city}`;
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
}
