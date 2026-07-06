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
