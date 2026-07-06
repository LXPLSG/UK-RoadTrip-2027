/** Application bootstrap, global lifecycle wiring and PWA installation handling. */
import { store } from './store.js';
import { router } from './router.js';
import { renderNav, toast } from './components.js';
import { renderView } from './views.js';
import { formatDateRange } from './utils.js';
import { themeManager } from './theme.js';
import { navigationRoute } from './navigation.js';
import { modeManager } from './mode.js';

const main = document.querySelector('#main');
const app = document.querySelector('#app');
let deferredInstall = null;

function render(route = router.current()) {
  const active = navigationRoute(route.name);
  document.querySelector('#desktop-nav').innerHTML = renderNav(active);
  document.querySelector('#mobile-nav').innerHTML = renderNav(active, true);
  document.querySelector('#brand-name').textContent = store.data.trip.name;
  document.querySelector('#brand-dates').textContent = formatDateRange(store.data.trip.startDate, store.data.trip.endDate);
  document.title = `${store.data.trip.name} · ${active[0].toUpperCase()}${active.slice(1)}`;
  renderView(main, route);
  app.setAttribute('aria-busy', 'false');
  window.scrollTo({ top: 0, behavior: 'instant' });
}

function updateConnectivity() {
  const status = document.querySelector('#sync-status');
  if (!status) return;
  const offline = !navigator.onLine;
  status.classList.toggle('is-offline', offline);
  status.innerHTML = `<span class="status-dot"></span>${offline ? 'Offline · trip available' : 'Online · trip cached'}`;
}

async function registerServiceWorker() {
  if (!('serviceWorker' in navigator)) return;
  try {
    const registration = await navigator.serviceWorker.register('./service-worker.js');
    registration.addEventListener('updatefound', () => {
      const worker = registration.installing;
      worker?.addEventListener('statechange', () => {
        if (worker.state === 'installed' && navigator.serviceWorker.controller) {
          toast('A new app version is ready. Reopen the app to update.', 6000);
        }
      });
    });
  } catch (error) {
    console.warn('Offline support could not be enabled.', error);
  }
}

function installHandling() {
  window.addEventListener('beforeinstallprompt', event => {
    event.preventDefault();
    deferredInstall = event;
  });
  window.addEventListener('appinstalled', () => { deferredInstall = null; toast('App installed'); });
  window.addEventListener('request-install', async () => {
    if (deferredInstall) {
      deferredInstall.prompt();
      await deferredInstall.userChoice;
      deferredInstall = null;
      return;
    }
    const standalone = matchMedia('(display-mode: standalone)').matches || navigator.standalone;
    if (standalone) toast('The app is already installed');
    else if (/iphone|ipad|ipod/i.test(navigator.userAgent)) toast('In Safari, tap Share, then Add to Home Screen.', 6000);
    else toast('Use your browser menu to install this app.', 5000);
  });
}

function bindImport() {
  document.querySelector('#file-import').addEventListener('change', async event => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    try {
      const data = JSON.parse(await file.text());
      store.replace(data, 'Trip imported');
    } catch (error) {
      toast(`Import failed: ${error.message}`, 6000);
    }
  });
}

async function start() {
  try {
    await store.initialise();
    themeManager.initialise(store.preferences.theme || 'system');
    modeManager.initialise(store.preferences.mode || 'automatic', store.data);
    store.addEventListener('change', event => { modeManager.set(modeManager.choice, store.data, false); render(); toast(event.detail.message); });
    store.addEventListener('preference', event => {
      if (event.detail.key === 'theme') themeManager.set(event.detail.value);
      if (event.detail.key === 'mode') modeManager.set(event.detail.value, store.data);
      render();
    });
    router.addEventListener('route', event => render(event.detail));
    bindImport();
    installHandling();
    window.addEventListener('online', updateConnectivity);
    window.addEventListener('offline', updateConnectivity);
    updateConnectivity();
    router.start();
    registerServiceWorker();
  } catch (error) {
    app.setAttribute('aria-busy', 'false');
    main.innerHTML = `<div class="loading-screen"><strong>Could not open this trip</strong><p>${error.message}</p><button class="btn" onclick="location.reload()">Try again</button></div>`;
  }
}

start();
