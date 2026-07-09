/** Reusable presentation components shared by all application views. */
import { icon } from './icons.js';
import { escapeHtml } from './utils.js';
import { navigationItems } from './navigation.js';

export function renderNav(active, mobile = false) {
  return navigationItems({ mobile }).map(item => `
    <a class="nav-link ${active === item.route ? 'active' : ''}" href="#/${item.route}" ${active === item.route ? 'aria-current="page"' : ''}>
      ${icon(item.icon)}<span>${item.label}</span>
    </a>`).join('');
}

export function pageHeader(eyebrow, title, subtitle = '', actions = '') {
  return `<header class="page-header">
    <div><p class="page-eyebrow">${escapeHtml(eyebrow)}</p><h1>${escapeHtml(title)}</h1>${subtitle ? `<p class="page-subtitle">${escapeHtml(subtitle)}</p>` : ''}</div>
    ${actions ? `<div class="button-row">${actions}</div>` : ''}
  </header>`;
}

export function statusTag(status = 'planned') {
  return `<span class="tag ${escapeHtml(status)}">${escapeHtml(status)}</span>`;
}

export function statusChip(status = 'planned') {
  return statusTag(status);
}

export function recommendationBadge(label = 'Recommended') {
  return `<span class="recommendation-badge">${icon('check', 'icon-sm')}${escapeHtml(label)}</span>`;
}

export function ratingBar(value = 0, max = 5) {
  const rating = Math.max(0, Math.min(max, Number(value || 0)));
  const width = max ? Math.round(rating / max * 100) : 0;
  return `<div class="rating-bar" aria-label="${rating} out of ${max}"><span style="width:${width}%"></span></div>`;
}

export function budgetCard({ label, value, meta = '', tone = 'green', progress = null }) {
  return `<article class="panel budget-card">
    <span>${escapeHtml(label)}</span>
    <strong class="tone-text-${escapeHtml(tone)}">${escapeHtml(value)}</strong>
    ${progress === null ? '' : `<div class="progress-track"><div class="progress-fill" style="width:${Math.max(0, Math.min(100, Number(progress)))}%"></div></div>`}
    ${meta ? `<span>${escapeHtml(meta)}</span>` : ''}
  </article>`;
}

export function priceCard({ label, amount, currency, status = '', detail = '' }) {
  return `<article class="price-card">
    <span>${escapeHtml(label)}</span>
    <strong>${escapeHtml(amount)}</strong>
    <small>${escapeHtml(currency)}${status ? ` · ${escapeHtml(status)}` : ''}</small>
    ${detail ? `<p>${escapeHtml(detail)}</p>` : ''}
  </article>`;
}

export function comparisonTable(columns = [], rows = []) {
  return `<div class="panel comparison-table"><table>
    <thead><tr>${columns.map(column => `<th>${escapeHtml(column)}</th>`).join('')}</tr></thead>
    <tbody>${rows.map(row => `<tr>${columns.map(column => `<td>${escapeHtml(row[column] ?? '')}</td>`).join('')}</tr>`).join('') || `<tr><td colspan="${columns.length}" class="muted">No comparison rows yet.</td></tr>`}</tbody>
  </table></div>`;
}

export function timeline(items = []) {
  return `<section class="panel timeline">${items.map(item => `
    <div class="day-row">
      <div class="day-date"><strong>${escapeHtml(item.primary || '')}</strong><span>${escapeHtml(item.secondary || '')}</span></div>
      <span class="timeline-marker" aria-hidden="true"></span>
      <div class="day-copy"><h3>${escapeHtml(item.title || '')}</h3><p>${escapeHtml(item.body || '')}</p></div>
      <div class="day-stats">${item.meta ? `<span>${escapeHtml(item.meta)}</span>` : ''}</div>
    </div>`).join('') || `<div class="panel-body muted">No timeline entries yet.</div>`}</section>`;
}

export function bookingCard({ item, iconName = 'pin', tone = 'sky', currency = 'GBP', details = [], actions = '' }) {
  const price = Number(item.price || item.cost || 0);
  return `<article class="place-card booking-card">
    <div class="place-card-head"><span class="place-type-icon tone-${escapeHtml(tone)}">${icon(iconName)}</span>${statusTag(item.status)}</div>
    <div class="place-card-body">
      <h3>${escapeHtml(item.title || item.name || item.label || 'Untitled')}</h3>
      <p>${escapeHtml([item.provider, item.city, item.date, item.reference].filter(Boolean).join(' · ') || item.notes || 'Details TBC')}</p>
      <div class="hotel-details">${details.map(detail => `<span><small>${escapeHtml(detail.label)}</small>${escapeHtml(detail.value || 'TBC')}</span>`).join('')}</div>
      ${price ? `<strong>${escapeHtml(new Intl.NumberFormat('en-GB', { style: 'currency', currency }).format(price))}</strong>` : ''}
    </div>
    <div class="place-card-foot">${actions || '<span class="muted">Managed in JSON</span>'}</div>
  </article>`;
}

export function emptyState(iconName, title, copy) {
  return `<div class="empty-state">${icon(iconName)}<strong>${escapeHtml(title)}</strong><span>${escapeHtml(copy)}</span></div>`;
}

export function printButton(label = 'Print') {
  return `<button class="btn print-view" type="button">${icon('print', 'icon-sm')}<span>${escapeHtml(label)}</span></button>`;
}

export function bindPrint(container) {
  container.querySelectorAll('.print-view').forEach(button => button.addEventListener('click', () => window.print()));
}

export function toast(message, duration = 2800) {
  const region = document.querySelector('#toast-region');
  if (!region) return;
  const node = document.createElement('div');
  node.className = 'toast';
  node.setAttribute('role', 'status');
  node.innerHTML = `${icon('check', 'icon-sm')}<span>${escapeHtml(message)}</span>`;
  region.append(node);
  setTimeout(() => node.remove(), duration);
}

export function openModal({ title, body, submitLabel = 'Save', onSubmit, destructive = false }) {
  const root = document.querySelector('#modal-root');
  const previousFocus = document.activeElement;
  root.innerHTML = `<div class="modal-backdrop" role="presentation">
    <section class="modal" role="dialog" aria-modal="true" aria-labelledby="modal-title">
      <header class="modal-header"><h2 id="modal-title">${escapeHtml(title)}</h2><button class="icon-btn" type="button" data-close aria-label="Close">${icon('close')}</button></header>
      <form id="modal-form">
        <div class="modal-body">${body}</div>
        <footer class="modal-footer"><button class="btn btn-ghost" type="button" data-close>Cancel</button><button class="btn ${destructive ? 'btn-danger' : 'btn-primary'}" type="submit">${escapeHtml(submitLabel)}</button></footer>
      </form>
    </section>
  </div>`;
  const close = () => {
    document.removeEventListener('keydown', handleKeys);
    root.innerHTML = '';
    previousFocus?.focus?.();
  };
  root.querySelectorAll('[data-close]').forEach(button => button.addEventListener('click', close));
  root.querySelector('.modal-backdrop').addEventListener('click', event => { if (event.target.classList.contains('modal-backdrop')) close(); });
  const handleKeys = event => {
    if (event.key === 'Escape') { close(); return; }
    if (event.key !== 'Tab') return;
    const controls = [...root.querySelectorAll('button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), a[href]')];
    if (!controls.length) return;
    const first = controls[0];
    const last = controls.at(-1);
    if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
    else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
  };
  document.addEventListener('keydown', handleKeys);
  root.querySelector('#modal-form').addEventListener('submit', async event => {
    event.preventDefault();
    const success = await onSubmit(event.currentTarget);
    if (success !== false) close();
  });
  setTimeout(() => root.querySelector('#modal-form input, #modal-form select, #modal-form textarea, #modal-form button')?.focus(), 0);
}

export function confirmAction({ title, message, confirmLabel = 'Delete', onConfirm }) {
  openModal({
    title,
    body: `<p class="muted">${escapeHtml(message)}</p>`,
    submitLabel: confirmLabel,
    destructive: true,
    onSubmit: () => { onConfirm(); return true; }
  });
}
