/** Domain view renderers and event bindings for the current application route. */
import { store } from './store.js';
import { repository } from './repository.js';
import { icon } from './icons.js';
import { pageHeader, statusTag, emptyState, openModal, confirmAction, toast, printButton, bindPrint, bookingCard, budgetCard, comparisonTable, priceCard } from './components.js';
import { escapeHtml as e, formatDate, formatDateRange, formatMoney, formatDuration, daysUntil, titleCase, uid, formObject, mapUrl, downloadJson } from './utils.js';
import { themeManager } from './theme.js';
import { modeManager } from './mode.js';
import { APP_VERSION } from './config.js';
import { calculateBudgetSummary, convertCurrency } from './budget.js';
import { notificationEngine } from './notifications.js';
import { accommodationOptionsForStop, accommodationStops, hotelComparisonRows, hotelOptionsByLocation } from './accommodation.js';

const typeTone = { hotel: 'green', attraction: 'sky', restaurant: 'coral', transport: 'purple', drive: 'amber', walk: 'green' };
const typeIcon = type => ({ hotel: 'hotel', attraction: 'attraction', restaurant: 'restaurant', transport: 'transport', drive: 'car', walk: 'walk' })[type] || 'pin';

function activateSegment(elements, active) {
  elements.forEach(item => {
    const selected = item === active;
    item.classList.toggle('active', selected);
    item.setAttribute('aria-pressed', String(selected));
  });
}

function activeDay(data) {
  const today = new Date().toISOString().slice(0, 10);
  return data.days.find(day => day.date === today) || (today < data.trip.startDate ? data.days[0] : data.days.at(-1));
}

function tripPhase(data) {
  const selectedMode = modeManager.effective(data);
  if (selectedMode === 'travel') return 'travel';
  const today = new Date().toISOString().slice(0, 10);
  if (today < data.trip.startDate) return 'preview';
  if (today > data.trip.endDate) return 'complete';
  return 'preview';
}

function totals(data) {
  const miles = data.days.reduce((sum, day) => sum + Number(day.distanceMiles || 0), 0);
  const driveMinutes = data.days.reduce((sum, day) => sum + Number(day.driveMinutes || 0), 0);
  return { miles, driveMinutes, spend: calculateBudgetSummary(data).forecast };
}

function metric(label, value, iconName, tone) {
  return `<article class="metric"><div class="metric-top"><span>${e(label)}</span><span class="metric-icon tone-${tone}">${icon(iconName, 'icon-sm')}</span></div><strong>${e(value)}</strong></article>`;
}

function dashboardPlanningRows(data) {
  const groups = [
    { label: 'Accommodation', iconName: 'hotel', tone: 'green', items: data.places.filter(place => place.type === 'hotel') },
    { label: 'Restaurants', iconName: 'restaurant', tone: 'coral', items: data.places.filter(place => place.type === 'restaurant') },
    { label: 'Attractions', iconName: 'attraction', tone: 'sky', items: data.places.filter(place => place.type === 'attraction') },
    { label: 'Bookings', iconName: 'check', tone: 'purple', items: data.bookings || [] }
  ];
  return groups.map(group => {
    const confirmed = group.items.filter(item => item.status === 'confirmed' || item.status === 'paid').length;
    const open = Math.max(0, group.items.length - confirmed);
    return `<div class="mini-row">
      <span class="mini-row-icon tone-${group.tone}">${icon(group.iconName, 'icon-sm')}</span>
      <div><strong>${e(group.label)}</strong><span>${group.items.length} saved · ${open} provisional</span></div>
      ${statusTag(confirmed ? `${confirmed} confirmed` : 'provisional')}
    </div>`;
  }).join('');
}

function dashboardRoute(data) {
  if (Array.isArray(data.trip.route) && data.trip.route.length) return data.trip.route.join(' → ');
  const fixedRoute = data.notes?.find(note => /route/i.test(note.title || ''));
  if (fixedRoute?.body) return fixedRoute.body;
  return data.days.map(day => day.region).filter(Boolean).filter((region, index, list) => list.indexOf(region) === index).join(' → ');
}

function renderDashboard(main) {
  const data = store.data;
  const trip = data.trip;
  const day = activeDay(data);
  const stats = totals(data);
  const budget = calculateBudgetSummary(data);
  const notifications = notificationEngine.list(data).slice(0, 4);
  const route = dashboardRoute(data);
  const countdown = daysUntil(trip.startDate);
  const remaining = data.checklists.flatMap(group => group.items).filter(item => !item.done);
  const openPlaces = data.places.filter(place => place.status === 'researching').slice(0, 4);
  const overnight = data.places.find(place => place.id === day?.overnightPlaceId);
  const countdownCopy = countdown > 0 ? `${countdown}` : countdown === 0 ? 'Now' : 'Done';

  main.innerHTML = `<div class="page">
    <section class="hero">
      <img class="hero-image" src="${e(trip.heroImage)}" width="1800" height="1013" fetchpriority="high" decoding="async" alt="A winding road through the Scottish Highlands">
      <div class="hero-content">
        <div><p class="hero-kicker">Planning dashboard · ${e(formatDateRange(trip.startDate, trip.endDate))}</p><h1>${e(trip.name)}</h1><p class="hero-meta">${e(trip.subtitle)} · ${data.days.length} days</p></div>
        <div class="countdown"><strong>${e(countdownCopy)}</strong><span>${countdown > 0 ? 'days to go' : countdown === 0 ? 'trip starts today' : 'trip complete'}</span></div>
      </div>
    </section>
    <section class="metric-grid" aria-label="Trip summary">
      ${metric('Distance', `${stats.miles.toLocaleString()} mi`, 'road', 'green')}
      ${metric('Driving time', formatDuration(stats.driveMinutes), 'clock', 'amber')}
      ${metric('Forecast', formatMoney(stats.spend, trip.homeCurrency), 'wallet', 'sky')}
      ${metric('Still to do', `${remaining.length} tasks`, 'check', 'coral')}
    </section>
    <section class="budget-summary" aria-label="Budget dashboard">
      ${budgetCard({ label: 'Total Budget', value: formatMoney(budget.totalBudget, trip.homeCurrency), meta: `${budget.travelerCount} traveller baseline`, progress: budget.totalBudget ? Math.min(100, budget.forecast / budget.totalBudget * 100) : 0 })}
      ${budgetCard({ label: 'Actual Spend', value: formatMoney(budget.actualSpend, trip.homeCurrency), meta: 'Paid and entered expenses', tone: 'sky' })}
      ${budgetCard({ label: 'Remaining', value: formatMoney(Math.abs(budget.remaining), trip.homeCurrency), meta: budget.remaining >= 0 ? 'Available forecast balance' : 'Forecast over budget', tone: budget.remaining >= 0 ? 'green' : 'coral' })}
    </section>
    <div class="section-header"><h2>${countdown > 0 ? 'First up' : 'Current plan'}</h2><a class="btn btn-ghost" href="#/itinerary">Full itinerary ${icon('arrowRight', 'icon-sm')}</a></div>
    ${day ? `<section class="panel next-day">
      <div class="date-tile"><strong>${e(formatDate(day.date, { day: 'numeric' }))}</strong><span>${e(formatDate(day.date, { month: 'short' }))}</span></div>
      <div><p class="page-eyebrow">Day ${data.days.indexOf(day) + 1} · ${e(day.region)}</p><h2>${e(day.title)}</h2><p>${e(day.summary)}</p></div>
      <a class="btn btn-primary" href="#/day/${e(day.id)}">Open day ${icon('arrowRight', 'icon-sm')}</a>
    </section>` : emptyState('calendar', 'No days yet', 'Add itinerary days in your trip JSON.')}
    <div class="dashboard-grid">
      <section>
        <div class="section-header"><h2>Trip essentials</h2></div>
        <div class="panel mini-list">
          <div class="mini-row"><span class="mini-row-icon tone-green">${icon('calendar', 'icon-sm')}</span><div><strong>Travel dates</strong><span>${e(formatDateRange(trip.startDate, trip.endDate))}</span></div><strong class="nowrap">${data.days.length} days</strong></div>
          <div class="mini-row"><span class="mini-row-icon tone-sky">${icon('pin', 'icon-sm')}</span><div><strong>Route</strong><span>${e(route)}</span></div>${statusTag('fixed')}</div>
          <div class="mini-row"><span class="mini-row-icon tone-purple">${icon('info', 'icon-sm')}</span><div><strong>Trip ID</strong><span>${e(data.activeTripId || trip.id)}</span></div><strong class="nowrap">rev ${Number(data.dataRevision || 0)}</strong></div>
        </div>
      </section>
      <section>
        <div class="section-header"><h2>Planning status</h2><a class="btn btn-ghost" href="#/places" aria-label="Open saved places">${icon('arrowRight')}</a></div>
        <div class="panel mini-list">${dashboardPlanningRows(data)}</div>
      </section>
    </div>
    <div class="dashboard-grid">
      <section>
        <div class="section-header"><h2>Plan at a glance</h2></div>
        <div class="panel mini-list">
          ${day?.activities.slice(0, 4).map(activity => `<div class="mini-row">
            <span class="mini-row-icon tone-${typeTone[activity.type] || 'sky'}">${icon(typeIcon(activity.type), 'icon-sm')}</span>
            <div><strong>${e(activity.title)}</strong><span>${e(activity.notes || titleCase(activity.type))}</span></div><strong class="nowrap">${e(activity.time || 'Anytime')}</strong>
          </div>`).join('') || '<div class="panel-body muted">No activities scheduled.</div>'}
          ${overnight ? `<div class="mini-row"><span class="mini-row-icon tone-green">${icon('bed', 'icon-sm')}</span><div><strong>${e(overnight.name)}</strong><span>${e(overnight.city)}</span></div>${statusTag(overnight.status)}</div>` : ''}
        </div>
      </section>
      <section>
        <div class="section-header"><h2>Needs attention</h2><a class="btn btn-ghost" href="#/checklist" aria-label="Open checklist">${icon('arrowRight')}</a></div>
        <div class="panel mini-list">
          ${openPlaces.length ? openPlaces.map(place => `<a class="mini-row" href="#/places?focus=${e(place.id)}"><span class="mini-row-icon tone-amber">${icon(typeIcon(place.type), 'icon-sm')}</span><div><strong>${e(place.name)}</strong><span>${e(place.city)} · ${e(titleCase(place.type))}</span></div>${statusTag(place.status)}</a>`).join('') : '<div class="panel-body muted">All place decisions are settled.</div>'}
        </div>
        <div class="section-header"><h2>Notification engine</h2><a class="btn btn-ghost" href="#/settings" aria-label="Open settings">${icon('arrowRight')}</a></div>
        <div class="panel mini-list">
          ${notifications.map(item => `<div class="mini-row"><span class="mini-row-icon tone-purple">${icon('alert', 'icon-sm')}</span><div><strong>${e(item.label || item.title)}</strong><span>${e(item.body || item.title)}</span></div>${statusTag(item.status || 'planned')}</div>`).join('')}
        </div>
      </section>
    </div>
  </div>`;
}

function renderToday(main) {
  const data = store.data;
  const day = activeDay(data);
  const phase = tripPhase(data);
  if (!day) { main.innerHTML = `<div class="page">${emptyState('calendar', 'No travel day available', 'Add itinerary days to use Travel Mode.')}</div>`; return; }
  const dayNumber = data.days.indexOf(day) + 1;
  const overnight = data.places.find(place => place.id === day.overnightPlaceId);
  const ordered = [...day.activities].sort((a, b) => (a.time || '').localeCompare(b.time || ''));
  const phaseLabel = phase === 'travel' ? 'Travel mode' : phase === 'complete' ? 'Trip complete' : 'Planning preview';
  main.innerHTML = `<div class="page">
    <header class="travel-header">
      <div><p class="page-eyebrow">${e(phaseLabel)} · Day ${dayNumber}</p><h1>${e(day.title)}</h1><p class="page-subtitle">${e(formatDate(day.date, { weekday: 'long', day: 'numeric', month: 'long' }))} · ${e(day.region)}</p></div>
      <a class="btn" href="#/day/${e(day.id)}">${icon('edit', 'icon-sm')}<span>Manage day</span></a>
    </header>
    <section class="travel-summary">
      <div><span>On the road</span><strong>${Number(day.distanceMiles || 0)} miles</strong></div>
      <div><span>Driving</span><strong>${e(formatDuration(day.driveMinutes))}</strong></div>
      <div><span>Overnight</span><strong>${e(overnight?.name || 'No stay planned')}</strong></div>
    </section>
    <div class="today-grid">
      <section><div class="section-header"><h2>Today’s schedule</h2><span class="muted">${ordered.length} stops</span></div>
        <div class="panel mini-list">${ordered.map(activity => {
          const place = data.places.find(item => item.id === activity.placeId);
          return `<div class="mini-row"><span class="mini-row-icon tone-${typeTone[activity.type] || 'sky'}">${icon(typeIcon(activity.type), 'icon-sm')}</span><div><strong>${e(activity.title)}</strong><span>${e(place?.name || activity.notes || titleCase(activity.type))}</span></div><strong class="nowrap">${e(activity.time || 'Anytime')}</strong></div>`;
        }).join('') || '<div class="panel-body muted">No activities scheduled.</div>'}</div>
      </section>
      <aside><div class="section-header"><h2>Quick access</h2></div><div class="stack">
        ${overnight ? `<article class="panel panel-body"><p class="page-eyebrow">Tonight</p><h3>${e(overnight.name)}</h3><p class="muted">${e(overnight.address || overnight.city)}</p><div class="button-row"><a class="btn" href="${e(mapUrl(overnight))}" target="_blank" rel="noopener">${icon('pin', 'icon-sm')} Directions</a>${overnight.phone ? `<a class="icon-btn" href="tel:${e(overnight.phone)}" aria-label="Call ${e(overnight.name)}">${icon('phone')}</a>` : ''}</div></article>` : ''}
        <article class="panel panel-body"><p class="page-eyebrow">Important numbers</p><div class="contact-strip">${data.contacts.map(contact => `<a href="${contact.type === 'phone' ? `tel:${e(contact.value)}` : '#'}"><span>${e(contact.label)}</span><strong>${e(contact.value)}</strong></a>`).join('')}</div></article>
      </div></aside>
    </div>
  </div>`;
}

function renderItinerary(main) {
  const data = store.data;
  const stats = totals(data);
  const countries = [...new Set(data.days.map(day => day.country))];
  main.innerHTML = `<div class="page">
    ${pageHeader('Your route', `${data.days.length} days, one clear plan`, `${formatDateRange(data.trip.startDate, data.trip.endDate)} · ${stats.miles.toLocaleString()} miles`, printButton('Print itinerary'))}
    <section class="route-overview">${metric('Countries', `${countries.length}`, 'pin', 'green')}${metric('Road days', `${data.days.filter(day => day.distanceMiles > 0).length}`, 'car', 'amber')}${metric('Activities', `${data.days.flatMap(day => day.activities).length}`, 'list', 'sky')}</section>
    <div class="itinerary-toolbar"><div class="segmented" id="country-filters"><button class="segment active" data-country="all">All</button>${countries.map(country => `<button class="segment" data-country="${e(country)}">${e(country)}</button>`).join('')}</div><span id="itinerary-count" class="muted"></span></div>
    <section class="panel timeline" id="itinerary-days">
      ${data.days.map((day, index) => `<a class="day-row" href="#/day/${e(day.id)}">
        <div class="day-date"><strong>${e(formatDate(day.date, { day: 'numeric' }))}</strong><span>${e(formatDate(day.date, { month: 'short' }))}</span></div>
        <span class="timeline-marker" aria-hidden="true"></span>
        <div class="day-copy"><h3>Day ${index + 1} · ${e(day.title)}</h3><p>${e(day.country)} · ${e(day.region)} · ${e(day.summary)}</p></div>
        <div class="day-stats"><span>${icon('road', 'icon-sm')} ${Number(day.distanceMiles || 0)} mi</span><span>${icon('clock', 'icon-sm')} ${e(formatDuration(day.driveMinutes))}</span>${icon('chevronRight')}</div>
      </a>`).join('')}
    </section>
  </div>`;
  const rows = [...main.querySelectorAll('.day-row')];
  const count = main.querySelector('#itinerary-count');
  const applyCountry = country => {
    let visible = 0;
    rows.forEach((row, index) => { const show = country === 'all' || data.days[index].country === country; row.hidden = !show; if (show) visible += 1; });
    count.textContent = `${visible} ${visible === 1 ? 'day' : 'days'}`;
  };
  main.querySelectorAll('#country-filters .segment').forEach(button => button.addEventListener('click', () => {
    activateSegment(main.querySelectorAll('#country-filters .segment'), button);
    applyCountry(button.dataset.country);
  }));
  applyCountry('all');
  bindPrint(main);
}

function dayForm(day) {
  return `<div class="form-grid">
    <label>Title<input name="title" required value="${e(day.title)}"></label>
    <label>Region<input name="region" required value="${e(day.region)}"></label>
    <label>Country<input name="country" required value="${e(day.country)}"></label>
    <label>Date<input type="date" name="date" required value="${e(day.date)}"></label>
    <label>Overnight place<select name="overnightPlaceId"><option value="">None</option>${store.data.places.filter(place => place.type === 'hotel').map(place => `<option value="${e(place.id)}" ${place.id === day.overnightPlaceId ? 'selected' : ''}>${e(place.name)}</option>`).join('')}</select></label>
    <label>Distance (miles)<input type="number" min="0" name="distanceMiles" value="${Number(day.distanceMiles || 0)}"></label>
    <label>Driving time (minutes)<input type="number" min="0" name="driveMinutes" value="${Number(day.driveMinutes || 0)}"></label>
    <label class="full">Summary<textarea name="summary">${e(day.summary || '')}</textarea></label>
  </div>`;
}

function activityForm(activity = {}) {
  const types = ['attraction', 'drive', 'hotel', 'restaurant', 'transport', 'walk'];
  return `<div class="form-grid">
    <label>Title<input name="title" required value="${e(activity.title || '')}"></label>
    <label>Time<input type="time" name="time" value="${e(activity.time || '')}"></label>
    <label>Type<select name="type">${types.map(type => `<option value="${type}" ${activity.type === type ? 'selected' : ''}>${titleCase(type)}</option>`).join('')}</select></label>
    <label>Status<select name="status">${['planned', 'confirmed', 'idea'].map(status => `<option value="${status}" ${activity.status === status ? 'selected' : ''}>${titleCase(status)}</option>`).join('')}</select></label>
    <label class="full">Linked place<select name="placeId"><option value="">None</option>${store.data.places.map(place => `<option value="${e(place.id)}" ${activity.placeId === place.id ? 'selected' : ''}>${e(place.name)} · ${e(place.city)}</option>`).join('')}</select></label>
    <label class="full">Notes<textarea name="notes">${e(activity.notes || '')}</textarea></label>
  </div>`;
}

function renderDay(main, id) {
  const data = store.data;
  const day = data.days.find(item => item.id === id);
  if (!day) { renderNotFound(main); return; }
  const index = data.days.indexOf(day);
  const previous = data.days[index - 1];
  const next = data.days[index + 1];
  const overnight = data.places.find(place => place.id === day.overnightPlaceId);
  main.innerHTML = `<div class="page">
    <nav class="day-pagination" aria-label="Adjacent itinerary days">${previous ? `<a href="#/day/${e(previous.id)}">${icon('arrowLeft', 'icon-sm')} Day ${index}</a>` : '<span></span>'}${next ? `<a href="#/day/${e(next.id)}">Day ${index + 2} ${icon('arrowRight', 'icon-sm')}</a>` : '<span></span>'}</nav>
    <div class="day-hero">
      <div><a class="page-eyebrow" href="#/itinerary">${icon('calendar', 'icon-sm')} Itinerary</a><h1>Day ${index + 1} · ${e(day.title)}</h1><p class="page-subtitle">${e(formatDate(day.date, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }))} · ${e(day.country)} · ${e(day.region)}</p></div>
      <div class="button-row">${printButton('Print day')}<button class="btn" id="edit-day">${icon('edit', 'icon-sm')}<span>Edit day</span></button><button class="btn btn-primary" id="add-activity">${icon('plus', 'icon-sm')}<span>Add activity</span></button></div>
    </div>
    <section class="metric-grid">
      ${metric('Distance', `${Number(day.distanceMiles || 0)} mi`, 'road', 'green')}
      ${metric('Drive', formatDuration(day.driveMinutes), 'clock', 'amber')}
      ${metric('Activities', `${day.activities.length}`, 'list', 'sky')}
      ${metric('Overnight', overnight?.city || 'None', 'bed', 'purple')}
    </section>
    <div class="section-header"><h2>Schedule</h2><span class="muted">${e(day.summary || '')}</span></div>
    ${day.activities.length ? `<section class="activity-list">${[...day.activities].sort((a, b) => (a.time || '').localeCompare(b.time || '')).map(activity => {
      const place = data.places.find(item => item.id === activity.placeId);
      return `<article class="activity">
        <div class="activity-time">${e(activity.time || 'Anytime')}</div><div class="activity-line"></div>
        <div class="activity-card"><div class="activity-card-head"><div><p class="page-eyebrow">${e(titleCase(activity.type))}${place ? ` · ${e(place.city)}` : ''}</p><h3>${e(activity.title)}</h3><p>${e(activity.notes || '')}</p></div><div class="card-actions"><button class="icon-btn edit-activity" data-id="${e(activity.id)}" aria-label="Edit ${e(activity.title)}">${icon('edit', 'icon-sm')}</button><button class="icon-btn delete-activity" data-id="${e(activity.id)}" aria-label="Delete ${e(activity.title)}">${icon('trash', 'icon-sm')}</button></div></div>${place ? `<div class="button-row" style="margin-top:12px"><a class="btn btn-ghost" href="${e(mapUrl(place))}" target="_blank" rel="noopener">${icon('pin', 'icon-sm')} Directions</a>${place.website ? `<a class="btn btn-ghost" href="${e(place.website)}" target="_blank" rel="noopener">Website ${icon('external', 'icon-sm')}</a>` : ''}</div>` : ''}</div>
      </article>`;
    }).join('')}</section>` : emptyState('calendar', 'A clear day', 'Add your first activity to start shaping this day.')}
  </div>`;

  main.querySelector('#edit-day').addEventListener('click', () => openModal({ title: `Edit day ${index + 1}`, body: dayForm(day), onSubmit: form => {
    const values = formObject(form);
    store.update(next => Object.assign(next.days.find(item => item.id === id), values, { distanceMiles: Number(values.distanceMiles), driveMinutes: Number(values.driveMinutes), overnightPlaceId: values.overnightPlaceId || null }));
  }}));
  main.querySelector('#add-activity').addEventListener('click', () => openModal({ title: 'Add activity', body: activityForm(), onSubmit: form => {
    const values = formObject(form);
    store.update(next => next.days.find(item => item.id === id).activities.push({ id: uid('activity'), ...values }));
  }}));
  main.querySelectorAll('.edit-activity').forEach(button => button.addEventListener('click', () => {
    const activity = day.activities.find(item => item.id === button.dataset.id);
    openModal({ title: 'Edit activity', body: activityForm(activity), onSubmit: form => {
      const values = formObject(form);
      store.update(next => Object.assign(next.days.find(item => item.id === id).activities.find(item => item.id === activity.id), values));
    }});
  }));
  main.querySelectorAll('.delete-activity').forEach(button => button.addEventListener('click', () => {
    const activity = day.activities.find(item => item.id === button.dataset.id);
    confirmAction({ title: 'Delete activity?', message: `${activity.title} will be removed from this day.`, onConfirm: () => store.update(next => {
      const target = next.days.find(item => item.id === id);
      target.activities = target.activities.filter(item => item.id !== activity.id);
    }, 'Activity deleted') });
  }));
  bindPrint(main);
}

function placeForm(place = {}) {
  const hotelFields = place.type === 'hotel' ? `
    <label>Booking reference<input name="bookingReference" value="${e(place.bookingReference || '')}"></label>
    <label>Parking<input name="parking" placeholder="On-site, public or TBC" value="${e(place.parking || '')}"></label>
    <label>Check-in<input name="checkIn" placeholder="From 15:00" value="${e(place.checkIn || '')}"></label>
    <label>Check-out<input name="checkOut" placeholder="By 11:00" value="${e(place.checkOut || '')}"></label>` : '';
  const restaurantFields = place.type === 'restaurant' ? `
    <label>Cuisine<input name="cuisine" value="${e(place.cuisine || '')}"></label>
    <label>Reservation reference<input name="reservationReference" value="${e(place.reservationReference || '')}"></label>
    <label>Reservation date<input type="date" name="reservationDate" value="${e(place.reservationDate || '')}"></label>
    <label>Reservation time<input type="time" name="reservationTime" value="${e(place.reservationTime || '')}"></label>` : '';
  const attractionFields = place.type === 'attraction' ? `
    <label>Opening hours<input name="openingHours" placeholder="Check before visiting" value="${e(place.openingHours || '')}"></label>
    <label>Ticket reference<input name="ticketReference" value="${e(place.ticketReference || '')}"></label>
    <label>Visit duration (minutes)<input type="number" min="0" name="durationMinutes" value="${Number(place.durationMinutes || 0)}"></label>
    <label>Advance booking<select name="bookingRequired"><option value="false" ${!place.bookingRequired ? 'selected' : ''}>Optional</option><option value="true" ${place.bookingRequired ? 'selected' : ''}>Required</option></select></label>` : '';
  return `<div class="form-grid">
    <label>Name<input name="name" required value="${e(place.name || '')}"></label>
    <label>Type<select name="type">${['hotel', 'attraction', 'restaurant', 'transport'].map(type => `<option value="${type}" ${place.type === type ? 'selected' : ''}>${titleCase(type)}</option>`).join('')}</select></label>
    <label>City / area<input name="city" required value="${e(place.city || '')}"></label>
    <label>Status<select name="status">${['researching', 'idea', 'planned', 'confirmed'].map(status => `<option value="${status}" ${place.status === status ? 'selected' : ''}>${titleCase(status)}</option>`).join('')}</select></label>
    <label class="full">Address<input name="address" value="${e(place.address || '')}"></label>
    <label>Estimated cost<input type="number" min="0" step="0.01" name="price" value="${Number(place.price || 0)}"></label>
    <label>Phone<input type="tel" name="phone" value="${e(place.phone || '')}"></label>
    <label class="full">Website<input type="url" name="website" placeholder="https://" value="${e(place.website || '')}"></label>
    ${hotelFields}
    ${restaurantFields}
    ${attractionFields}
    <label class="full">Notes<textarea name="notes">${e(place.notes || '')}</textarea></label>
  </div>`;
}

function renderAttractions(main) {
  const data = store.data;
  const attractions = data.places.filter(place => place.type === 'attraction');
  const linked = new Set(data.days.flatMap(day => day.activities.map(activity => activity.placeId).filter(Boolean)));
  main.innerHTML = `<div class="page">
    ${pageHeader('Things to do', 'Attractions and tickets', 'Track ideas, timed entry, ticket references and itinerary links.', `<button class="btn btn-primary" id="add-attraction">${icon('plus', 'icon-sm')}<span>Add attraction</span></button>`)}
    <section class="route-overview">${metric('Saved', `${attractions.length}`, 'attraction', 'sky')}${metric('In itinerary', `${attractions.filter(item => linked.has(item.id)).length}`, 'calendar', 'green')}${metric('Need decision', `${attractions.filter(item => ['idea', 'researching'].includes(item.status)).length}`, 'alert', 'amber')}</section>
    <div class="filter-bar"><div class="search-wrap">${icon('search')}<input id="attraction-search" type="search" placeholder="Search attraction or city" aria-label="Search attractions"></div><div class="segmented" id="attraction-filters">${['all', 'planned', 'idea'].map((status, index) => `<button class="segment ${index === 0 ? 'active' : ''}" data-status="${status}">${titleCase(status)}</button>`).join('')}</div></div>
    <div class="place-grid" id="attraction-list"></div>
  </div>`;
  let statusFilter = 'all';
  const search = main.querySelector('#attraction-search');
  const list = main.querySelector('#attraction-list');
  const draw = () => {
    const term = search.value.trim().toLowerCase();
    const visible = attractions.filter(attraction => (statusFilter === 'all' || attraction.status === statusFilter) && `${attraction.name} ${attraction.city}`.toLowerCase().includes(term));
    list.innerHTML = visible.map(attraction => `<article class="place-card"><div class="place-card-head"><span class="place-type-icon tone-sky">${icon('attraction')}</span>${statusTag(attraction.status)}</div><div class="place-card-body"><h3>${e(attraction.name)}</h3><p>${e(attraction.city)} · ${linked.has(attraction.id) ? 'In itinerary' : 'Not scheduled'}</p><div class="hotel-details"><span><small>Opening</small>${e(attraction.openingHours || 'Check before visiting')}</span><span><small>Booking</small>${attraction.bookingRequired ? 'Advance booking required' : 'No requirement recorded'}</span><span><small>Ticket</small>${e(attraction.ticketReference || 'TBC')}</span></div>${Number(attraction.price) ? `<strong>${formatMoney(attraction.price, data.trip.homeCurrency)}</strong>` : ''}</div><div class="place-card-foot"><a class="btn btn-ghost" href="${e(mapUrl(attraction))}" target="_blank" rel="noopener">${icon('pin', 'icon-sm')} Map</a><div class="card-actions"><button class="icon-btn edit-attraction" data-id="${e(attraction.id)}" aria-label="Edit ${e(attraction.name)}">${icon('edit', 'icon-sm')}</button><button class="icon-btn delete-attraction" data-id="${e(attraction.id)}" aria-label="Delete ${e(attraction.name)}">${icon('trash', 'icon-sm')}</button></div></div></article>`).join('') || emptyState('search', 'No matching attractions', 'Adjust the search or add another attraction.');
    list.querySelectorAll('.edit-attraction').forEach(button => button.addEventListener('click', () => { const attraction = attractions.find(item => item.id === button.dataset.id); openModal({ title: 'Edit attraction', body: placeForm(attraction), onSubmit: form => { const values = formObject(form); store.update(next => Object.assign(next.places.find(item => item.id === attraction.id), values, { type: 'attraction', price: Number(values.price || 0), durationMinutes: Number(values.durationMinutes || 0), bookingRequired: values.bookingRequired === 'true' })); } }); }));
    list.querySelectorAll('.delete-attraction').forEach(button => button.addEventListener('click', () => { const attraction = attractions.find(item => item.id === button.dataset.id); confirmAction({ title: 'Delete attraction?', message: `${attraction.name} and its itinerary links will be removed.`, onConfirm: () => removePlace(attraction) }); }));
  };
  main.querySelector('#add-attraction').addEventListener('click', () => openModal({ title: 'Add attraction', body: placeForm({ type: 'attraction', status: 'researching' }), onSubmit: form => { const values = formObject(form); store.update(next => next.places.push({ id: uid('attraction'), lat: null, lng: null, ...values, type: 'attraction', price: Number(values.price || 0), durationMinutes: Number(values.durationMinutes || 0), bookingRequired: values.bookingRequired === 'true' })); } }));
  search.addEventListener('input', draw);
  main.querySelectorAll('#attraction-filters .segment').forEach(button => button.addEventListener('click', () => { statusFilter = button.dataset.status; activateSegment(main.querySelectorAll('#attraction-filters .segment'), button); draw(); }));
  draw();
}

function renderDriving(main) {
  const data = store.data;
  const guide = data.drivingGuide;
  const roadDays = data.days.filter(day => Number(day.distanceMiles) > 0);
  const stats = totals(data);
  main.innerHTML = `<div class="page">
    ${pageHeader('On the road', 'Driving guide', `${guide.units} · Guidance reviewed ${formatDate(guide.lastReviewed)}`, printButton('Print guide'))}
    <section class="route-overview">${metric('Route distance', `${stats.miles.toLocaleString()} mi`, 'road', 'green')}${metric('Wheel time', formatDuration(stats.driveMinutes), 'clock', 'amber')}${metric('Road days', `${roadDays.length}`, 'car', 'sky')}</section>
    <div class="driving-layout">
      <section><div class="section-header"><h2>Daily drives</h2></div><div class="panel drive-list">${roadDays.map(day => `<a class="drive-row" href="#/day/${e(day.id)}"><span class="drive-day">${e(formatDate(day.date, { day: 'numeric', month: 'short' }))}</span><div><strong>${e(day.title)}</strong><span>${e(day.country)} · ${e(day.region)}</span></div><div class="drive-numbers"><strong>${Number(day.distanceMiles)} mi</strong><span>${e(formatDuration(day.driveMinutes))}</span></div>${icon('chevronRight')}</a>`).join('')}</div></section>
      <aside class="stack"><div><div class="section-header"><h2>Rental vehicle</h2></div><article class="panel panel-body"><h3>${e(data.trip.vehicle.label)}</h3><div class="hotel-details"><span><small>Provider</small>${e(data.trip.vehicle.provider)}</span><span><small>Registration</small>${e(data.trip.vehicle.registration)}</span><span><small>Pickup</small>${e(data.trip.vehicle.pickup)}</span><span><small>Drop-off</small>${e(data.trip.vehicle.dropoff)}</span></div></article></div><article class="panel panel-body"><p class="page-eyebrow">Emergency</p><div class="emergency-number"><span>Emergency services</span><a href="tel:${e(guide.emergencyNumber)}">${e(guide.emergencyNumber)}</a></div><div class="emergency-number"><span>Breakdown assistance</span><strong>${e(guide.breakdownNumber)}</strong></div></article></aside>
    </div>
    <div class="section-header"><h2>UK road essentials</h2><a class="btn btn-ghost" href="${e(guide.sourceUrl)}" target="_blank" rel="noopener">Official guidance ${icon('external', 'icon-sm')}</a></div>
    <section class="rule-grid">${guide.rules.map((rule, index) => `<article class="panel rule-card"><span>${String(index + 1).padStart(2, '0')}</span><div><h3>${e(rule.title)}</h3><p>${e(rule.detail)}</p></div></article>`).join('')}</section>
  </div>`;
  bindPrint(main);
}

function tubeJourneyForm(journey = {}) {
  return `<div class="form-grid">
    <label>From<input name="from" required value="${e(journey.from || '')}"></label><label>To<input name="to" required value="${e(journey.to || '')}"></label>
    <label>Date<input type="date" name="date" required value="${e(journey.date || store.data.trip.startDate)}"></label><label>Departure time<input type="time" name="time" required value="${e(journey.time || '09:00')}"></label>
    <label class="full">Route and lines<input name="route" required placeholder="Line, direction and interchange" value="${e(journey.route || '')}"></label>
    <label>Estimated duration<input type="number" min="0" name="durationMinutes" required value="${Number(journey.durationMinutes || 0)}"></label><label>Status<select name="status">${['idea', 'planned', 'confirmed'].map(status => `<option value="${status}" ${journey.status === status ? 'selected' : ''}>${titleCase(status)}</option>`).join('')}</select></label>
    <label class="full">Accessibility notes<textarea name="accessibility">${e(journey.accessibility || '')}</textarea></label><label class="full">Journey notes<textarea name="notes">${e(journey.notes || '')}</textarea></label>
  </div>`;
}

function renderTube(main) {
  const data = store.data;
  const plan = data.tubePlan;
  const journeys = [...plan.journeys].sort((a, b) => `${a.date}${a.time}`.localeCompare(`${b.date}${b.time}`));
  main.innerHTML = `<div class="page">
    ${pageHeader('London transport', 'Tube journey planner', 'Save the route you intend to take, then verify live service before leaving.', `<button class="btn btn-primary" id="add-tube-journey">${icon('plus', 'icon-sm')}<span>Add journey</span></button>`)}
    <section class="tube-notice"><span class="tone-purple">${icon('train')}</span><div><strong>Offline plan, live-check ready</strong><p>${e(plan.paymentNote)}</p></div><a class="btn" href="${e(plan.sourceUrl)}" target="_blank" rel="noopener">Open TfL ${icon('external', 'icon-sm')}</a></section>
    <div class="section-header"><h2>Saved journeys</h2><span class="muted">Reviewed ${e(formatDate(plan.lastReviewed))}</span></div>
    <section class="tube-list">${journeys.map(journey => `<article class="panel tube-journey"><div class="tube-time"><strong>${e(journey.time)}</strong><span>${e(formatDate(journey.date, { day: 'numeric', month: 'short' }))}</span></div><div class="tube-route"><div><span class="tube-station-dot"></span><strong>${e(journey.from)}</strong></div><p>${e(journey.route)} · ${e(formatDuration(journey.durationMinutes))}</p><div><span class="tube-station-dot"></span><strong>${e(journey.to)}</strong></div><small>${e(journey.accessibility || journey.notes || '')}</small></div><div class="tube-actions">${statusTag(journey.status)}<button class="icon-btn edit-tube" data-id="${e(journey.id)}" aria-label="Edit journey from ${e(journey.from)}">${icon('edit', 'icon-sm')}</button><button class="icon-btn delete-tube" data-id="${e(journey.id)}" aria-label="Delete journey from ${e(journey.from)}">${icon('trash', 'icon-sm')}</button></div></article>`).join('') || emptyState('train', 'No Tube journeys saved', 'Add the routes you may need in London.')}</section>
  </div>`;
  main.querySelector('#add-tube-journey').addEventListener('click', () => openModal({ title: 'Add Tube journey', body: tubeJourneyForm(), onSubmit: form => { const values = formObject(form); store.update(next => next.tubePlan.journeys.push({ id: uid('tube'), ...values, durationMinutes: Number(values.durationMinutes) })); } }));
  main.querySelectorAll('.edit-tube').forEach(button => button.addEventListener('click', () => { const journey = journeys.find(item => item.id === button.dataset.id); openModal({ title: 'Edit Tube journey', body: tubeJourneyForm(journey), onSubmit: form => { const values = formObject(form); store.update(next => Object.assign(next.tubePlan.journeys.find(item => item.id === journey.id), values, { durationMinutes: Number(values.durationMinutes) })); } }); }));
  main.querySelectorAll('.delete-tube').forEach(button => button.addEventListener('click', () => { const journey = journeys.find(item => item.id === button.dataset.id); confirmAction({ title: 'Delete Tube journey?', message: `${journey.from} to ${journey.to} will be removed.`, onConfirm: () => store.update(next => { next.tubePlan.journeys = next.tubePlan.journeys.filter(item => item.id !== journey.id); }, 'Tube journey deleted') }); }));
}

function renderRestaurants(main) {
  const data = store.data;
  const restaurants = data.places.filter(place => place.type === 'restaurant');
  const cities = [...new Set(restaurants.map(place => place.city))];
  main.innerHTML = `<div class="page">
    ${pageHeader('Dining', 'Restaurants and reservations', 'Keep shortlists, confirmed tables and meal estimates together.', `<button class="btn btn-primary" id="add-restaurant">${icon('plus', 'icon-sm')}<span>Add restaurant</span></button>`)}
    <div class="itinerary-toolbar"><div class="segmented" id="restaurant-filters"><button class="segment active" data-city="all">All</button>${cities.map(city => `<button class="segment" data-city="${e(city)}">${e(city)}</button>`).join('')}</div><span class="muted">${restaurants.length} saved</span></div>
    <div class="place-grid" id="restaurant-list">${restaurants.map(restaurant => `<article class="place-card restaurant-card" data-city="${e(restaurant.city)}"><div class="place-card-head"><span class="place-type-icon tone-coral">${icon('restaurant')}</span>${statusTag(restaurant.status)}</div><div class="place-card-body"><h3>${e(restaurant.name)}</h3><p>${e(restaurant.city)} · ${e(restaurant.cuisine || 'Cuisine TBC')}</p><div class="hotel-details"><span><small>Reservation</small>${e(restaurant.reservationDate ? formatDate(restaurant.reservationDate) : 'Date TBC')} ${e(restaurant.reservationTime || '')}</span><span><small>Reference</small>${e(restaurant.reservationReference || 'TBC')}</span><span><small>Notes</small>${e(restaurant.notes || 'No notes yet.')}</span></div>${Number(restaurant.price) ? `<strong>${formatMoney(restaurant.price, data.trip.homeCurrency)}</strong>` : ''}</div><div class="place-card-foot"><a class="btn btn-ghost" href="${e(mapUrl(restaurant))}" target="_blank" rel="noopener">${icon('pin', 'icon-sm')} Map</a><div class="card-actions"><button class="icon-btn edit-restaurant" data-id="${e(restaurant.id)}" aria-label="Edit ${e(restaurant.name)}">${icon('edit', 'icon-sm')}</button><button class="icon-btn delete-restaurant" data-id="${e(restaurant.id)}" aria-label="Delete ${e(restaurant.name)}">${icon('trash', 'icon-sm')}</button></div></div></article>`).join('') || emptyState('restaurant', 'No restaurants yet', 'Add dining ideas or confirmed reservations.')}</div>
  </div>`;
  const cards = [...main.querySelectorAll('.restaurant-card')];
  main.querySelectorAll('#restaurant-filters .segment').forEach(button => button.addEventListener('click', () => { activateSegment(main.querySelectorAll('#restaurant-filters .segment'), button); cards.forEach(card => { card.hidden = button.dataset.city !== 'all' && card.dataset.city !== button.dataset.city; }); }));
  main.querySelector('#add-restaurant').addEventListener('click', () => openModal({ title: 'Add restaurant', body: placeForm({ type: 'restaurant', status: 'researching' }), onSubmit: form => { const values = formObject(form); store.update(next => next.places.push({ id: uid('restaurant'), lat: null, lng: null, ...values, type: 'restaurant', price: Number(values.price || 0) })); } }));
  main.querySelectorAll('.edit-restaurant').forEach(button => button.addEventListener('click', () => { const restaurant = restaurants.find(item => item.id === button.dataset.id); openModal({ title: 'Edit restaurant', body: placeForm(restaurant), onSubmit: form => { const values = formObject(form); store.update(next => Object.assign(next.places.find(item => item.id === restaurant.id), values, { type: 'restaurant', price: Number(values.price || 0) })); } }); }));
  main.querySelectorAll('.delete-restaurant').forEach(button => button.addEventListener('click', () => { const restaurant = restaurants.find(item => item.id === button.dataset.id); confirmAction({ title: 'Delete restaurant?', message: `${restaurant.name} will be removed from places and linked activities.`, onConfirm: () => removePlace(restaurant) }); }));
}

function removePlace(place) {
  store.update(next => {
    next.places = next.places.filter(item => item.id !== place.id);
    next.days.forEach(day => {
      if (day.overnightPlaceId === place.id) day.overnightPlaceId = null;
      day.activities.forEach(activity => { if (activity.placeId === place.id) activity.placeId = ''; });
    });
  }, 'Place deleted');
}

function hotelOptionCriteria(option) {
  const preferred = ['overall', 'value', 'comfort', 'parking', 'breakfast', 'kitchen', 'laundry', 'family', 'transport', 'loyaltyBenefits'];
  const label = key => key === 'loyaltyBenefits' ? 'Loyalty Benefits' : titleCase(key);
  return preferred.filter(key => key in (option.scores || {})).map(key => `<span><small>${e(label(key))}</small>${Number(option.scores[key] || 0)}/10</span>`).join('');
}

function accommodationChip(label = 'Researching') {
  const slug = label.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  return `<span class="tag ${e(slug)}">${e(label)}</span>`;
}

function scoreBars(option) {
  const rows = [
    ['overall', 'Overall'], ['value', 'Value'], ['comfort', 'Comfort'], ['parking', 'Parking'], ['breakfast', 'Breakfast'],
    ['kitchen', 'Kitchen'], ['laundry', 'Laundry'], ['family', 'Family'], ['transport', 'Transport'], ['loyaltyBenefits', 'Loyalty']
  ];
  return `<div class="score-bars">${rows.map(([key, label]) => {
    const value = Math.max(0, Math.min(10, Number(option.scores?.[key] || 0)));
    return `<div class="score-row"><span>${e(label)}</span><div class="progress-track"><div class="progress-fill" style="width:${value * 10}%"></div></div><strong>${value.toFixed(value % 1 ? 1 : 0)}</strong></div>`;
  }).join('')}</div>`;
}

function distanceMiles(from, to) {
  if (![from?.lat, from?.lng, to?.lat, to?.lng].every(value => Number.isFinite(Number(value)))) return null;
  const toRad = value => Number(value) * Math.PI / 180;
  const earthMiles = 3958.8;
  const dLat = toRad(to.lat - from.lat);
  const dLng = toRad(to.lng - from.lng);
  const lat1 = toRad(from.lat);
  const lat2 = toRad(to.lat);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return earthMiles * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function directionsUrl(from, to) {
  const origin = Number.isFinite(Number(from?.lat)) && Number.isFinite(Number(from?.lng)) ? `${from.lat},${from.lng}` : `${from.name}, ${from.area || from.location}`;
  const destination = Number.isFinite(Number(to?.lat)) && Number.isFinite(Number(to?.lng)) ? `${to.lat},${to.lng}` : `${to.name}, ${to.city}`;
  return `https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(origin)}&destination=${encodeURIComponent(destination)}&travelmode=walking`;
}

function nearbyAttractions(option, data) {
  const preferred = new Set(option.nearbyAttractionIds || []);
  const attractions = (data.places || []).filter(place => place.type === 'attraction' && (preferred.has(place.id) || place.city === option.location || place.city === option.area || place.city === 'Cotswolds'));
  return attractions
    .map(attraction => ({ ...attraction, distance: distanceMiles(option, attraction) }))
    .filter(attraction => attraction.distance !== null)
    .sort((a, b) => a.distance - b.distance)
    .slice(0, 3);
}

function hotelQuickAccess(option, data) {
  const attractions = nearbyAttractions(option, data);
  return `<div class="hotel-quick-access">
    <div class="button-row">
      ${option.website ? `<a class="btn btn-ghost" href="${e(option.website)}" target="_blank" rel="noopener">${icon('external', 'icon-sm')} Official website</a>` : '<span class="btn btn-ghost disabled" aria-disabled="true">Official site TBC</span>'}
      ${option.bookingUrl ? `<a class="btn btn-ghost" href="${e(option.bookingUrl)}" target="_blank" rel="noopener">${icon('external', 'icon-sm')} Booking page</a>` : ''}
    </div>
    <div class="nearby-map-list">
      <p class="page-eyebrow">Nearby attractions</p>
      ${attractions.length ? attractions.map(attraction => `<a href="${e(directionsUrl(option, attraction))}" target="_blank" rel="noopener"><span>${e(attraction.name)}</span><strong>${attraction.distance < 0.1 ? '<0.1' : attraction.distance.toFixed(1)} mi ${icon('external', 'icon-sm')}</strong></a>`).join('') : '<span class="muted">Add hotel coordinates to calculate nearby attraction distances.</span>'}
    </div>
  </div>`;
}

function accommodationStopCard(stop, options) {
  const recommended = options[0] || {};
  const score = Number(recommended.score || 0);
  return `<a class="accommodation-stop-card panel" href="#/accommodation/${e(stop.id)}" aria-label="Open ${e(stop.location)} accommodation options">
    <img src="${e(stop.image || '../assets/images/accommodation-default.svg')}" alt="" loading="lazy" decoding="async">
    <div class="accommodation-stop-body">
      <div class="accommodation-stop-top"><div><p class="page-eyebrow">${e(stop.dateLabel || '')}</p><h3>${e(stop.location)}</h3></div>${accommodationChip(recommended.bookingStatus || stop.status || 'Researching')}</div>
      <div class="hotel-details"><span><small>Nights</small>${Number(stop.nights || 0)}</span><span><small>Recommended</small>${e(recommended.name || 'TBC')}</span><span><small>Score</small>${score}%</span></div>
      <p>${e(stop.notes || recommended.notes || 'Notes TBC')}</p>
      <span class="btn btn-primary">Open options ${icon('arrowRight', 'icon-sm')}</span>
    </div>
  </a>`;
}

function hotelOptionCard(option, best = false, data = store.data) {
  const pros = (option.pros || []).slice(0, 2).join(' · ');
  const cons = (option.cons || []).slice(0, 2).join(' · ');
  return `<article class="hotel-option-card ${best ? 'recommended' : ''}">
    <div class="hotel-option-score"><strong>${Number(option.score || 0)}</strong><span>score</span></div>
    <div class="hotel-option-copy">
      <div class="hotel-option-head"><div><h3>${e(option.name)}</h3><p>${e(option.area || option.location)} · ${e(option.role || (best ? 'Recommended' : 'Alternative'))}</p></div>${best ? '<span class="recommendation-badge">Recommended</span>' : accommodationChip(option.bookingStatus || option.status)}</div>
      <div class="hotel-details">${hotelOptionCriteria(option)}</div>
      ${scoreBars(option)}
      <p><strong>Pros:</strong> ${e(pros || 'Add pros after research.')}</p>
      <p><strong>Watch:</strong> ${e(cons || 'Add trade-offs after research.')}</p>
      ${hotelQuickAccess(option, data)}
      <div class="hotel-details"><span><small>Booking Status</small>${e(option.bookingStatus || 'Researching')}</span><span><small>Confirmation Number</small>${e(option.confirmationNumber || 'TBC')}</span><span><small>Booked Via</small>${e(option.bookedVia || 'TBC')}</span><span><small>Cancellation Date</small>${e(option.cancellationDate || 'TBC')}</span><span><small>Payment Status</small>${e(option.paymentStatus || 'TBC')}</span></div>
    </div>
  </article>`;
}

function accommodationComparisonRows(options) {
  const columns = ['Item', ...options.map(option => option.role || option.name)];
  const read = (option, key, fallback = 'TBC') => option.features?.[key] ?? fallback;
  const yesNo = value => value === true ? 'Yes' : value === false ? 'No' : value || 'TBC';
  const rows = [
    { label: 'Hotel', values: options.map(option => option.name) },
    { label: 'Parking', values: options.map(option => yesNo(read(option, 'parking'))) },
    { label: 'Breakfast', values: options.map(option => read(option, 'breakfast')) },
    { label: 'Kitchen', values: options.map(option => yesNo(read(option, 'kitchen'))) },
    { label: 'Laundry', values: options.map(option => yesNo(read(option, 'laundry'))) },
    { label: 'Family Friendly', values: options.map(option => read(option, 'familyFriendly', option.scores?.family || 'TBC')) },
    { label: 'Walk Score', values: options.map(option => read(option, 'walkScore', option.scores?.transport || 'TBC')) },
    { label: 'My Score', values: options.map(option => read(option, 'myScore', option.scores?.overall || 'TBC')) }
  ];
  return {
    columns,
    rows: rows.map(row => Object.fromEntries(columns.map((column, index) => [column, index === 0 ? row.label : row.values[index - 1]])))
  };
}

function accommodationDetail(main, id) {
  const data = store.data;
  const stops = accommodationStops(data);
  const stop = stops.find(item => item.id === id);
  if (!stop) { renderNotFound(main); return; }
  const options = accommodationOptionsForStop(data, stop);
  const comparison = accommodationComparisonRows(options);
  const recommended = options[0];
  main.innerHTML = `<div class="page">
    <nav class="day-pagination" aria-label="Accommodation navigation"><a href="#/accommodation">${icon('arrowLeft', 'icon-sm')} Accommodation</a><span></span></nav>
    ${pageHeader('Accommodation', `${stop.location} options`, `${e(stop.dateLabel || '')} · ${Number(stop.nights || 0)} nights · ${options.length} hotel options`, recommended?.bookingUrl ? `<a class="btn btn-primary" href="${e(recommended.bookingUrl)}" target="_blank" rel="noopener">Book recommended ${icon('external', 'icon-sm')}</a>` : '')}
    <section class="panel accommodation-detail-hero">
      <img src="${e(stop.image || '../assets/images/accommodation-default.svg')}" alt="" loading="lazy" decoding="async">
      <div><p class="page-eyebrow">Current recommendation</p><h2>${e(recommended?.name || 'TBC')}</h2><p>${e(stop.notes || recommended?.notes || '')}</p><div class="hotel-details"><span><small>Status</small>${e(recommended?.bookingStatus || stop.status || 'Researching')}</span><span><small>Score</small>${Number(recommended?.score || 0)}%</span><span><small>Payment</small>${e(recommended?.paymentStatus || 'TBC')}</span></div></div>
    </section>
    <div class="section-header"><h2>Hotel options</h2><span class="muted">Ratings, scoring and booking tracker.</span></div>
    <div class="hotel-option-list">${options.map((option, index) => hotelOptionCard(option, index === 0, data)).join('')}</div>
    <div class="section-header"><h2>Hotel Comparison</h2><span class="muted">Feature comparison and personal scores.</span></div>
    ${comparisonTable(comparison.columns, comparison.rows)}
  </div>`;
}

function renderHotels(main, id = null) {
  if (id) { accommodationDetail(main, id); return; }
  const data = store.data;
  const hotels = data.places.filter(place => place.type === 'hotel');
  const linkedNights = data.days.filter(day => day.overnightPlaceId).length;
  const stops = accommodationStops(data);
  const stopOptionPairs = stops.map(stop => ({ stop, options: accommodationOptionsForStop(data, stop) }));
  const allOptions = stopOptionPairs.flatMap(pair => pair.options);
  const ready = allOptions.filter(option => ['Ready to Book', 'Booked'].includes(option.bookingStatus)).length;
  main.innerHTML = `<div class="page">
    ${pageHeader('Accommodation', 'Accommodation planning centre', `${linkedNights} itinerary nights linked · ${allOptions.length} hotel options`, `<button class="btn btn-primary" id="add-hotel">${icon('plus', 'icon-sm')}<span>Add hotel</span></button>`)}
    <section class="route-overview">${metric('Stops', `${stops.length}`, 'hotel', 'green')}${metric('Hotel options', `${allOptions.length}`, 'list', 'sky')}${metric('Ready/booked', `${ready}`, 'check', 'purple')}</section>
    <div class="section-header"><h2>Accommodation Dashboard</h2><span class="muted">One card per overnight stop.</span></div>
    ${stops.length ? `<section class="accommodation-dashboard">${stopOptionPairs.map(pair => accommodationStopCard(pair.stop, pair.options)).join('')}</section>` : emptyState('hotel', 'No accommodation stops yet', 'Add accommodationStops in the trip JSON.')}
    <div class="section-header"><h2>Linked overnight placeholders</h2><span class="muted">Used by itinerary days until a final hotel is selected.</span></div>
    <div class="place-grid">${hotels.map(hotel => {
      const nights = data.days.filter(day => day.overnightPlaceId === hotel.id);
      return `<article class="place-card hotel-card"><div class="place-card-head"><span class="place-type-icon tone-green">${icon('hotel')}</span>${statusTag(hotel.status)}</div><div class="place-card-body"><h3>${e(hotel.name)}</h3><p>${e(hotel.city)} · ${nights.length} ${nights.length === 1 ? 'night' : 'nights'}</p><div class="hotel-details"><span><small>Address</small>${e(hotel.address || 'TBC')}</span><span><small>Parking</small>${e(hotel.parking || 'TBC')}</span><span><small>Reference</small>${e(hotel.bookingReference || 'TBC')}</span></div>${Number(hotel.price) ? `<strong>${formatMoney(hotel.price, data.trip.homeCurrency)}</strong>` : ''}</div><div class="place-card-foot"><a class="btn btn-ghost" href="${e(mapUrl(hotel))}" target="_blank" rel="noopener">${icon('pin', 'icon-sm')} Map</a><div class="card-actions"><button class="icon-btn edit-hotel" data-id="${e(hotel.id)}" aria-label="Edit ${e(hotel.name)}">${icon('edit', 'icon-sm')}</button><button class="icon-btn delete-hotel" data-id="${e(hotel.id)}" aria-label="Delete ${e(hotel.name)}">${icon('trash', 'icon-sm')}</button></div></div></article>`;
    }).join('') || emptyState('hotel', 'No hotels yet', 'Add accommodation candidates and connect them to itinerary nights.')}</div>
  </div>`;
  main.querySelector('#add-hotel').addEventListener('click', () => openModal({ title: 'Add hotel', body: placeForm({ type: 'hotel', status: 'researching' }), onSubmit: form => {
    const values = formObject(form);
    store.update(next => next.places.push({ id: uid('hotel'), lat: null, lng: null, ...values, type: 'hotel', price: Number(values.price || 0) }));
  }}));
  main.querySelectorAll('.edit-hotel').forEach(button => button.addEventListener('click', () => {
    const hotel = hotels.find(item => item.id === button.dataset.id);
    openModal({ title: 'Edit hotel', body: placeForm(hotel), onSubmit: form => { const values = formObject(form); store.update(next => Object.assign(next.places.find(item => item.id === hotel.id), values, { type: 'hotel', price: Number(values.price || 0) })); } });
  }));
  main.querySelectorAll('.delete-hotel').forEach(button => button.addEventListener('click', () => {
    const hotel = hotels.find(item => item.id === button.dataset.id);
    confirmAction({ title: 'Delete hotel?', message: `${hotel.name} and its itinerary links will be removed.`, onConfirm: () => removePlace(hotel) });
  }));
}

function renderPlaces(main) {
  const data = store.data;
  main.innerHTML = `<div class="page">
    ${pageHeader('Saved places', 'Hotels, sights and tables', 'Keep every candidate and confirmed booking in one searchable list.', `<button class="btn btn-primary" id="add-place">${icon('plus', 'icon-sm')}<span>Add place</span></button>`)}
    <div class="filter-bar"><div class="search-wrap">${icon('search')}<input id="place-search" type="search" placeholder="Search by name, city or note" aria-label="Search places"></div><div class="segmented" id="place-filters">${['all', 'hotel', 'attraction', 'restaurant'].map((type, index) => `<button class="segment ${index === 0 ? 'active' : ''}" data-type="${type}">${titleCase(type)}</button>`).join('')}</div></div>
    <div id="place-results" class="place-grid"></div>
  </div>`;
  let filter = 'all';
  const results = main.querySelector('#place-results');
  const search = main.querySelector('#place-search');
  const draw = () => {
    const term = search.value.trim().toLowerCase();
    const places = data.places.filter(place => (filter === 'all' || place.type === filter) && [place.name, place.city, place.notes].join(' ').toLowerCase().includes(term));
    results.innerHTML = places.length ? places.map(place => `<article class="place-card">
      <div class="place-card-head"><span class="place-type-icon tone-${typeTone[place.type] || 'sky'}">${icon(typeIcon(place.type))}</span>${statusTag(place.status)}</div>
      <div class="place-card-body"><h3>${e(place.name)}</h3><p>${e(place.city)}${place.address ? ` · ${e(place.address)}` : ''}</p><p style="margin-top:9px">${e(place.notes || 'No notes yet.')}</p>${Number(place.price) ? `<strong style="display:block;margin-top:12px">${formatMoney(place.price, data.trip.homeCurrency)}</strong>` : ''}</div>
      <div class="place-card-foot"><a class="btn btn-ghost" href="${e(mapUrl(place))}" target="_blank" rel="noopener">${icon('pin', 'icon-sm')} Map</a><div class="card-actions">${place.website ? `<a class="icon-btn" href="${e(place.website)}" target="_blank" rel="noopener" aria-label="Open ${e(place.name)} website">${icon('external', 'icon-sm')}</a>` : ''}<button class="icon-btn edit-place" data-id="${e(place.id)}" aria-label="Edit ${e(place.name)}">${icon('edit', 'icon-sm')}</button><button class="icon-btn delete-place" data-id="${e(place.id)}" aria-label="Delete ${e(place.name)}">${icon('trash', 'icon-sm')}</button></div></div>
    </article>`).join('') : emptyState('search', 'No matching places', 'Try another search or add a new place.');
    bindPlaceCards();
  };
  const bindPlaceCards = () => {
    results.querySelectorAll('.edit-place').forEach(button => button.addEventListener('click', () => {
      const place = data.places.find(item => item.id === button.dataset.id);
      openModal({ title: 'Edit place', body: placeForm(place), onSubmit: form => {
        const values = formObject(form);
        store.update(next => Object.assign(next.places.find(item => item.id === place.id), values, { price: Number(values.price || 0) }));
      }});
    }));
    results.querySelectorAll('.delete-place').forEach(button => button.addEventListener('click', () => {
      const place = data.places.find(item => item.id === button.dataset.id);
      const inUse = data.days.some(day => day.overnightPlaceId === place.id || day.activities.some(activity => activity.placeId === place.id));
      confirmAction({ title: 'Delete place?', message: inUse ? `${place.name} is linked to the itinerary. Deleting it will also remove those links.` : `${place.name} will be removed.`, onConfirm: () => removePlace(place) });
    }));
  };
  main.querySelector('#add-place').addEventListener('click', () => openModal({ title: 'Add place', body: placeForm(), onSubmit: form => {
    const values = formObject(form);
    store.update(next => next.places.push({ id: uid('place'), lat: null, lng: null, ...values, price: Number(values.price || 0) }));
  }}));
  search.addEventListener('input', draw);
  main.querySelectorAll('.segment').forEach(button => button.addEventListener('click', () => { filter = button.dataset.type; activateSegment(main.querySelectorAll('.segment'), button); draw(); }));
  draw();
}

function expenseForm(expense = {}) {
  return `<div class="form-grid">
    <label>Description<input name="description" required value="${e(expense.description || '')}"></label>
    <label>Category<select name="category">${store.data.budgetCategories.map(category => `<option ${expense.category === category ? 'selected' : ''}>${e(category)}</option>`).join('')}</select></label>
    <label>Date<input type="date" name="date" required value="${e(expense.date || store.data.trip.startDate)}"></label>
    <label>Amount<input type="number" min="0" step="0.01" name="amount" required value="${Number(expense.amount || 0)}"></label>
    <label>Status<select name="status"><option value="planned" ${expense.status === 'planned' ? 'selected' : ''}>Planned</option><option value="paid" ${expense.status === 'paid' ? 'selected' : ''}>Paid</option></select></label>
    <label>Linked place<select name="placeId"><option value="">None</option>${store.data.places.map(place => `<option value="${e(place.id)}" ${expense.placeId === place.id ? 'selected' : ''}>${e(place.name)}</option>`).join('')}</select></label>
  </div>`;
}

function renderBudget(main) {
  const data = store.data;
  const budget = calculateBudgetSummary(data);
  const percent = Math.min(100, Math.round((budget.forecast / Number(budget.totalBudget || 1)) * 100));
  const currencies = Object.keys(data.currencyRates?.rates || { [data.trip.homeCurrency]: 1 });
  const converted = convertCurrency(budget.forecast, data.trip.homeCurrency, currencies.includes('SGD') ? 'SGD' : data.trip.homeCurrency, data.currencyRates);
  main.innerHTML = `<div class="page">
    ${pageHeader('Money', 'Budget without surprises', `All figures in ${data.trip.homeCurrency}. Place estimates and ledger entries update this view automatically.`, `${printButton('Print budget')}<button class="btn btn-primary" id="add-expense">${icon('plus', 'icon-sm')}<span>Add expense</span></button>`)}
    <section class="budget-summary">
      ${budgetCard({ label: 'Total Budget', value: formatMoney(budget.totalBudget, data.trip.homeCurrency), meta: `${percent}% forecast usage`, progress: percent })}
      ${budgetCard({ label: 'Actual Spend', value: formatMoney(budget.actualSpend, data.trip.homeCurrency), meta: 'Paid or entered ledger items', tone: 'sky' })}
      ${budgetCard({ label: 'Forecast', value: formatMoney(budget.forecast, data.trip.homeCurrency), meta: `${formatMoney(converted, currencies.includes('SGD') ? 'SGD' : data.trip.homeCurrency)} converted`, tone: 'purple' })}
      ${budgetCard({ label: budget.remaining >= 0 ? 'Remaining' : 'Over Budget', value: formatMoney(Math.abs(budget.remaining), data.trip.homeCurrency), meta: `${formatMoney(budget.perPerson, data.trip.homeCurrency)} per person`, tone: budget.remaining >= 0 ? 'green' : 'coral' })}
    </section>
    <div class="dashboard-grid">
      <section><div class="section-header"><h2>Expense ledger</h2></div><div class="panel"><table class="expense-table"><thead><tr><th>Description</th><th>Category</th><th>Status</th><th>Amount</th><th><span class="sr-only">Actions</span></th></tr></thead><tbody>
        ${data.expenses.map(expense => `<tr><td><strong>${e(expense.description)}</strong><br><span class="subtle">${e(formatDate(expense.date))}</span></td><td>${e(expense.category)}</td><td>${statusTag(expense.status)}</td><td>${formatMoney(expense.amount, data.trip.homeCurrency)}</td><td><div class="card-actions"><button class="icon-btn edit-expense" data-id="${e(expense.id)}" aria-label="Edit ${e(expense.description)}">${icon('edit', 'icon-sm')}</button><button class="icon-btn delete-expense" data-id="${e(expense.id)}" aria-label="Delete ${e(expense.description)}">${icon('trash', 'icon-sm')}</button></div></td></tr>`).join('') || '<tr><td colspan="5" class="muted">No ledger entries yet.</td></tr>'}
      </tbody></table></div></section>
      <section><div class="section-header"><h2>By category</h2></div><div class="panel panel-body stack">${budget.byCategory.map(item => `<div class="category-bar"><strong>${e(item.category)}</strong><div class="progress-track"><div class="progress-fill" style="width:${budget.forecast ? Math.round(item.amount / budget.forecast * 100) : 0}%;background:var(--sky)"></div></div><span>${formatMoney(item.amount, data.trip.homeCurrency)}</span></div>`).join('')}</div></section>
    </div>
    <div class="section-header"><h2>Forecast sources</h2></div>
    ${comparisonTable(['Description', 'Category', 'Status', 'Amount', 'Source'], budget.ledger.map(item => ({ Description: item.description, Category: item.category, Status: item.status, Amount: formatMoney(item.amount, data.trip.homeCurrency), Source: titleCase(item.source) })))}
  </div>`;
  main.querySelector('#add-expense').addEventListener('click', () => openModal({ title: 'Add expense', body: expenseForm(), onSubmit: form => {
    const values = formObject(form);
    store.update(next => next.expenses.push({ id: uid('expense'), ...values, amount: Number(values.amount) }));
  }}));
  main.querySelectorAll('.edit-expense').forEach(button => button.addEventListener('click', () => {
    const expense = data.expenses.find(item => item.id === button.dataset.id);
    openModal({ title: 'Edit expense', body: expenseForm(expense), onSubmit: form => { const values = formObject(form); store.update(next => Object.assign(next.expenses.find(item => item.id === expense.id), values, { amount: Number(values.amount) })); } });
  }));
  main.querySelectorAll('.delete-expense').forEach(button => button.addEventListener('click', () => {
    const expense = data.expenses.find(item => item.id === button.dataset.id);
    confirmAction({ title: 'Delete expense?', message: `${expense.description} will be removed from the budget.`, onConfirm: () => store.update(next => { next.expenses = next.expenses.filter(item => item.id !== expense.id); }, 'Expense deleted') });
  }));
  bindPrint(main);
}

function moduleForRoute(data, routeName) {
  return (data.travelModules || []).find(module => module.route === routeName);
}

function moduleItems(data, module) {
  const collection = data[module.collection] || [];
  if (module.collection === 'places' && module.type) return collection.filter(item => item.type === module.type);
  if (module.collection === 'checklists' && module.type) return collection.filter(item => item.type === module.type);
  return collection;
}

function itemTitle(item) {
  return item.title || item.name || item.label || item.description || 'Untitled item';
}

function moduleDetails(item) {
  return [
    { label: 'Provider', value: item.provider || item.type || item.category || item.city || '' },
    { label: 'Date', value: item.date || item.startDate || item.expiryDate || item.updatedAt?.slice?.(0, 10) || '' },
    { label: 'Reference', value: item.reference || item.bookingReference || item.reservationReference || item.value || '' },
    { label: 'Notes', value: item.notes || item.body || '' }
  ].filter(detail => detail.value);
}

function renderTravelModule(main, routeName) {
  const data = store.data;
  const module = moduleForRoute(data, routeName);
  if (!module) { renderNotFound(main); return; }
  const items = moduleItems(data, module);
  const confirmed = items.filter(item => item.status === 'confirmed' || item.status === 'paid').length;
  const priced = items.reduce((sum, item) => sum + Number(item.price || item.cost || item.amount || 0), 0);
  const rows = items.map(item => ({
    Item: itemTitle(item),
    Status: item.status || 'planned',
    Reference: item.reference || item.bookingReference || item.reservationReference || item.value || 'TBC',
    Notes: item.notes || item.body || ''
  }));
  main.innerHTML = `<div class="page">
    ${pageHeader(module.eyebrow, module.title, module.summary, `<a class="btn" href="#/settings">${icon('edit', 'icon-sm')}<span>Edit JSON</span></a>`)}
    <section class="module-overview">
      ${priceCard({ label: 'Saved Items', amount: String(items.length), currency: 'records', detail: 'Loaded from trip JSON' })}
      ${priceCard({ label: 'Confirmed', amount: String(confirmed), currency: 'records', status: 'current' })}
      ${priceCard({ label: 'Forecast', amount: formatMoney(priced, data.trip.homeCurrency), currency: data.trip.homeCurrency, detail: 'From item prices' })}
      ${priceCard({ label: 'Trip ID', amount: data.activeTripId, currency: data.trip.homeCurrency, detail: 'Reusable platform model' })}
    </section>
    <div class="place-grid">
      ${items.map(item => bookingCard({
        item: { ...item, title: itemTitle(item), status: item.status || 'planned' },
        iconName: module.icon,
        tone: module.tone,
        currency: data.trip.homeCurrency,
        details: moduleDetails(item)
      })).join('') || emptyState(module.icon, `${module.title} not populated yet`, 'Add records to the active versioned trip JSON when this part of the plan is ready.')}
    </div>
    <div class="section-header"><h2>Comparison</h2><span class="muted">Reusable table component</span></div>
    ${comparisonTable(['Item', 'Status', 'Reference', 'Notes'], rows)}
  </div>`;
}

function renderChecklist(main) {
  const data = store.data;
  const all = data.checklists.flatMap(group => group.items);
  const done = all.filter(item => item.done).length;
  const percent = all.length ? Math.round(done / all.length * 100) : 0;
  main.innerHTML = `<div class="page">
    ${pageHeader('Ready to go', 'Planning checklist', `${done} of ${all.length} complete · ${percent}% ready`, `<button class="btn btn-primary" id="add-task">${icon('plus', 'icon-sm')}<span>Add task</span></button>`)}
    <div class="progress-track" style="margin-bottom:24px"><div class="progress-fill" style="width:${percent}%"></div></div>
    <div class="checklist-layout">${data.checklists.map(group => `<section class="panel checklist"><div class="panel-header"><h2>${e(group.title)}</h2><span class="tag">${group.items.filter(item => item.done).length}/${group.items.length}</span></div>${group.items.map(item => `<div class="check-row ${item.done ? 'done' : ''}"><input id="${e(item.id)}" class="task-toggle" type="checkbox" data-group="${e(group.id)}" data-id="${e(item.id)}" ${item.done ? 'checked' : ''}><label for="${e(item.id)}">${e(item.label)}</label><button type="button" class="icon-btn delete-task" data-group="${e(group.id)}" data-id="${e(item.id)}" aria-label="Delete ${e(item.label)}">${icon('trash', 'icon-sm')}</button></div>`).join('') || '<div class="panel-body muted">No tasks in this list.</div>'}</section>`).join('')}</div>
  </div>`;
  main.querySelectorAll('.task-toggle').forEach(input => input.addEventListener('change', () => store.update(next => { next.checklists.find(group => group.id === input.dataset.group).items.find(item => item.id === input.dataset.id).done = input.checked; }, input.checked ? 'Task complete' : 'Task reopened')));
  main.querySelectorAll('.delete-task').forEach(button => button.addEventListener('click', event => { event.preventDefault(); store.update(next => { const group = next.checklists.find(item => item.id === button.dataset.group); group.items = group.items.filter(item => item.id !== button.dataset.id); }, 'Task deleted'); }));
  main.querySelector('#add-task').addEventListener('click', () => openModal({ title: 'Add task', body: `<div class="form-grid"><label class="full">Task<input name="label" required></label><label class="full">List<select name="groupId">${data.checklists.map(group => `<option value="${e(group.id)}">${e(group.title)}</option>`).join('')}</select></label></div>`, onSubmit: form => {
    const values = formObject(form);
    store.update(next => next.checklists.find(group => group.id === values.groupId).items.push({ id: uid('task'), label: values.label, done: false }));
  }}));
}

function renderPacking(main) {
  const data = store.data;
  const groups = data.checklists.filter(group => group.type === 'packing');
  const items = groups.flatMap(group => group.items);
  const packed = items.filter(item => item.done).length;
  const percent = items.length ? Math.round(packed / items.length * 100) : 0;
  main.innerHTML = `<div class="page">
    ${pageHeader('Travel ready', 'Packing list', `${packed} of ${items.length} packed`, groups.length ? `<button class="btn btn-primary" id="add-packing-item">${icon('plus', 'icon-sm')}<span>Add item</span></button>` : '')}
    <section class="packing-progress"><div><span>Overall progress</span><strong>${percent}%</strong></div><div class="progress-track"><div class="progress-fill" style="width:${percent}%"></div></div></section>
    <div class="checklist-layout">${groups.map(group => `<section class="panel checklist"><div class="panel-header"><h2>${e(group.title)}</h2><span class="tag">${group.items.filter(item => item.done).length}/${group.items.length}</span></div>${group.items.map(item => `<div class="check-row ${item.done ? 'done' : ''}"><input id="${e(item.id)}" class="packing-toggle" type="checkbox" data-group="${e(group.id)}" data-id="${e(item.id)}" ${item.done ? 'checked' : ''}><label for="${e(item.id)}">${e(item.label)}</label><button type="button" class="icon-btn delete-packing" data-group="${e(group.id)}" data-id="${e(item.id)}" aria-label="Delete ${e(item.label)}">${icon('trash', 'icon-sm')}</button></div>`).join('') || '<div class="panel-body muted">This list is empty.</div>'}</section>`).join('') || emptyState('list', 'No packing lists', 'Add a packing checklist group in trip JSON.')}</div>
  </div>`;
  main.querySelectorAll('.packing-toggle').forEach(input => input.addEventListener('change', () => store.update(next => { next.checklists.find(group => group.id === input.dataset.group).items.find(item => item.id === input.dataset.id).done = input.checked; }, input.checked ? 'Packed' : 'Returned to packing list')));
  main.querySelectorAll('.delete-packing').forEach(button => button.addEventListener('click', event => { event.preventDefault(); store.update(next => { const group = next.checklists.find(item => item.id === button.dataset.group); group.items = group.items.filter(item => item.id !== button.dataset.id); }, 'Packing item deleted'); }));
  main.querySelector('#add-packing-item')?.addEventListener('click', () => openModal({ title: 'Add packing item', body: `<div class="form-grid"><label class="full">Item<input name="label" required></label><label class="full">List<select name="groupId">${groups.map(group => `<option value="${e(group.id)}">${e(group.title)}</option>`).join('')}</select></label></div>`, onSubmit: form => { const values = formObject(form); store.update(next => next.checklists.find(group => group.id === values.groupId).items.push({ id: uid('pack'), label: values.label, done: false })); } }));
}

function noteForm(note = {}) {
  return `<div class="form-grid"><label class="full">Title<input name="title" required value="${e(note.title || '')}"></label><label>Category<select name="category">${store.data.noteCategories.map(category => `<option ${note.category === category ? 'selected' : ''}>${e(category)}</option>`).join('')}</select></label><label>Linked day<select name="dayId"><option value="">None</option>${store.data.days.map((day, index) => `<option value="${e(day.id)}" ${note.dayId === day.id ? 'selected' : ''}>Day ${index + 1} · ${e(day.title)}</option>`).join('')}</select></label><label class="full">Note<textarea name="body" required>${e(note.body || '')}</textarea></label><label class="full"><span>Priority</span><select name="pinned"><option value="false" ${!note.pinned ? 'selected' : ''}>Standard</option><option value="true" ${note.pinned ? 'selected' : ''}>Pinned</option></select></label></div>`;
}

function renderNotes(main) {
  const data = store.data;
  main.innerHTML = `<div class="page">
    ${pageHeader('Trip notebook', 'Notes', 'Capture decisions, reminders and context without losing them in the itinerary.', `<button class="btn btn-primary" id="add-note">${icon('plus', 'icon-sm')}<span>Add note</span></button>`)}
    <div class="filter-bar"><div class="search-wrap">${icon('search')}<input id="note-search" type="search" placeholder="Search notes" aria-label="Search notes"></div><div class="segmented" id="note-filters"><button class="segment active" data-category="all">All</button>${data.noteCategories.map(category => `<button class="segment" data-category="${e(category)}">${e(category)}</button>`).join('')}</div></div>
    <section class="note-grid" id="note-list"></section>
  </div>`;
  let category = 'all';
  const search = main.querySelector('#note-search');
  const list = main.querySelector('#note-list');
  const draw = () => {
    const term = search.value.trim().toLowerCase();
    const notes = [...data.notes].filter(note => (category === 'all' || note.category === category) && `${note.title} ${note.body}`.toLowerCase().includes(term)).sort((a, b) => Number(b.pinned) - Number(a.pinned) || b.updatedAt.localeCompare(a.updatedAt));
    list.innerHTML = notes.map(note => { const day = data.days.find(item => item.id === note.dayId); return `<article class="panel note-card ${note.pinned ? 'pinned' : ''}"><div class="note-card-head"><span class="tag ${note.pinned ? 'confirmed' : ''}">${note.pinned ? 'Pinned' : e(note.category)}</span><div class="card-actions"><button class="icon-btn edit-note" data-id="${e(note.id)}" aria-label="Edit ${e(note.title)}">${icon('edit', 'icon-sm')}</button><button class="icon-btn delete-note" data-id="${e(note.id)}" aria-label="Delete ${e(note.title)}">${icon('trash', 'icon-sm')}</button></div></div><h3>${e(note.title)}</h3><p>${e(note.body)}</p><footer>${day ? `<a href="#/day/${e(day.id)}">${icon('calendar', 'icon-sm')} ${e(day.title)}</a>` : `<span>${e(note.category)}</span>`}<time datetime="${e(note.updatedAt)}">${e(new Date(note.updatedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }))}</time></footer></article>`; }).join('') || emptyState('note', 'No matching notes', 'Add a note or adjust your filters.');
    list.querySelectorAll('.edit-note').forEach(button => button.addEventListener('click', () => { const note = data.notes.find(item => item.id === button.dataset.id); openModal({ title: 'Edit note', body: noteForm(note), onSubmit: form => { const values = formObject(form); store.update(next => Object.assign(next.notes.find(item => item.id === note.id), values, { pinned: values.pinned === 'true', updatedAt: new Date().toISOString() })); } }); }));
    list.querySelectorAll('.delete-note').forEach(button => button.addEventListener('click', () => { const note = data.notes.find(item => item.id === button.dataset.id); confirmAction({ title: 'Delete note?', message: `${note.title} will be permanently removed.`, onConfirm: () => store.update(next => { next.notes = next.notes.filter(item => item.id !== note.id); }, 'Note deleted') }); }));
  };
  main.querySelector('#add-note').addEventListener('click', () => openModal({ title: 'Add note', body: noteForm(), onSubmit: form => { const values = formObject(form); store.update(next => next.notes.push({ id: uid('note'), ...values, pinned: values.pinned === 'true', updatedAt: new Date().toISOString() })); } }));
  search.addEventListener('input', draw);
  main.querySelectorAll('#note-filters .segment').forEach(button => button.addEventListener('click', () => { category = button.dataset.category; activateSegment(main.querySelectorAll('#note-filters .segment'), button); draw(); }));
  draw();
}

function tripSettingsForm(trip) {
  return `<div class="form-grid"><label class="full">Trip name<input name="name" required value="${e(trip.name)}"></label><label>Start date<input type="date" name="startDate" required value="${e(trip.startDate)}"></label><label>End date<input type="date" name="endDate" required value="${e(trip.endDate)}"></label><label>Home currency<input name="homeCurrency" maxlength="3" required value="${e(trip.homeCurrency)}"></label><label>Total budget<input type="number" min="0" name="budget" value="${Number(trip.budget || 0)}"></label><label class="full">Subtitle<input name="subtitle" value="${e(trip.subtitle || '')}"></label><label class="full">Travelers<input name="travelers" value="${e((trip.travelers || []).join(', '))}"><span class="field-help">Separate names with commas.</span></label><label class="full">Trip notes<textarea name="notes">${e(trip.notes || '')}</textarea></label></div>`;
}

function renderSettings(main) {
  const data = store.data;
  const preferences = store.preferences;
  const compact = JSON.stringify(data, null, 2);
  const bytes = new Blob([compact]).size;
  const quickLinks = [
    ['hotels', 'Hotels', 'bed'], ['restaurants', 'Restaurants', 'restaurant'], ['attractions', 'Attractions', 'attraction'],
    ['flights', 'Flights', 'plane'], ['car-rental', 'Car Rental', 'car'], ['documents', 'Documents', 'document'],
    ['driving', 'Driving guide', 'car'], ['tube', 'Tube planner', 'train'], ['budget', 'Budget', 'wallet'],
    ['weather', 'Weather', 'weather'], ['packing', 'Packing', 'list'], ['notes', 'Notes', 'note'],
    ['emergency-contacts', 'Emergency', 'phone'], ['companions', 'Companions', 'users'], ['checklist', 'Checklist', 'check']
  ];
  main.innerHTML = `<div class="page">
    ${pageHeader('Control centre', 'Settings and trip data', 'Manage the experience, working data, backups and installation.')}
    <div class="settings-layout"><section class="stack">
      <div class="panel settings-section"><div class="section-header" style="margin:0"><div><h2>Trip details</h2><p class="muted" style="margin:4px 0 0">${e(formatDateRange(data.trip.startDate, data.trip.endDate))}</p></div><button class="btn" id="edit-trip">${icon('edit', 'icon-sm')} Edit</button></div></div>
      <div class="panel settings-section"><h2>Experience</h2><div class="setting-row"><div><strong>Appearance</strong><span>Follow your device or choose a fixed theme.</span></div><div class="segmented" id="theme-options">${['system', 'light', 'dark'].map(theme => `<button class="segment ${themeManager.choice === theme ? 'active' : ''}" data-theme-choice="${theme}">${titleCase(theme)}</button>`).join('')}</div></div><div class="setting-row"><div><strong>Trip mode</strong><span>Automatic uses the trip date range.</span></div><div class="segmented" id="mode-options">${['automatic', 'planning', 'travel'].map(mode => `<button class="segment ${(preferences.mode || 'automatic') === mode ? 'active' : ''}" data-mode-choice="${mode}">${titleCase(mode)}</button>`).join('')}</div></div><div class="setting-row"><div><strong>Install app</strong><span>Add this trip to your home screen.</span></div><button class="btn" id="install-app">${icon('download', 'icon-sm')} Install</button></div></div>
      <div class="panel settings-section"><div class="section-header" style="margin:0 0 14px"><div><h2>Trip JSON</h2><p class="muted" style="margin:4px 0 0">Advanced editing of the complete working dataset.</p></div><button class="btn btn-primary" id="save-json">${icon('save', 'icon-sm')} Save JSON</button></div><textarea id="json-editor" class="json-editor" spellcheck="false" aria-label="Trip JSON editor">${e(compact)}</textarea></div>
    </section><aside class="stack">
      <div class="panel settings-section"><h2>All tools</h2><div class="settings-links">${quickLinks.map(([route, label, iconName]) => `<a href="#/${route}">${icon(iconName, 'icon-sm')}<span>${label}</span>${icon('chevronRight', 'icon-sm')}</a>`).join('')}</div></div>
      <div class="panel settings-section"><h2>Data tools</h2><div class="stack"><button class="btn" id="export-json">${icon('download', 'icon-sm')} Export backup</button><button class="btn" id="import-json">${icon('upload', 'icon-sm')} Import JSON</button><button class="btn" id="restore-backup" ${repository.hasBackup() ? '' : 'disabled'}>${icon('refresh', 'icon-sm')} Restore last backup</button><button class="btn btn-danger" id="reset-data">${icon('trash', 'icon-sm')} Restore bundled trip</button></div></div>
      <div class="panel settings-section"><h2>Data health</h2><div class="data-health"><div class="health-item"><span>App</span><strong>v${APP_VERSION}</strong></div><div class="health-item"><span>Schema</span><strong>v${data.schemaVersion}</strong></div><div class="health-item"><span>Working copy</span><strong>${Math.max(1, Math.round(bytes / 1024))} KB</strong></div><div class="health-item"><span>Last saved</span><strong>${e(new Date(data.lastUpdated).toLocaleString('en-GB', { dateStyle: 'medium', timeStyle: 'short' }))}</strong></div></div></div>
    </aside></div>
  </div>`;
  main.querySelector('#edit-trip').addEventListener('click', () => openModal({ title: 'Edit trip details', body: tripSettingsForm(data.trip), onSubmit: form => { const values = formObject(form); if (values.endDate < values.startDate) { toast('End date must be after the start date'); return false; } store.update(next => {
    Object.assign(next.trip, values, { budget: Number(values.budget), homeCurrency: values.homeCurrency.toUpperCase(), travelers: values.travelers.split(',').map(name => name.trim()).filter(Boolean) });
    const summary = next.trips.find(trip => trip.id === next.activeTripId);
    if (summary) Object.assign(summary, { name: next.trip.name, startDate: next.trip.startDate, endDate: next.trip.endDate, homeCurrency: next.trip.homeCurrency });
  }); } }));
  main.querySelectorAll('[data-theme-choice]').forEach(button => button.addEventListener('click', () => store.setPreference('theme', button.dataset.themeChoice)));
  main.querySelectorAll('[data-mode-choice]').forEach(button => button.addEventListener('click', () => store.setPreference('mode', button.dataset.modeChoice)));
  main.querySelector('#save-json').addEventListener('click', () => { try { store.replace(JSON.parse(main.querySelector('#json-editor').value), 'JSON saved'); } catch (error) { toast(`Could not save: ${error.message}`, 5000); } });
  main.querySelector('#export-json').addEventListener('click', () => { downloadJson(data, `uk-road-trip-${new Date().toISOString().slice(0, 10)}.json`); toast('Backup exported'); });
  main.querySelector('#import-json').addEventListener('click', () => document.querySelector('#file-import').click());
  main.querySelector('#restore-backup').addEventListener('click', () => confirmAction({ title: 'Restore previous data?', message: 'Your current working copy will be replaced by the most recent backup.', confirmLabel: 'Restore', onConfirm: () => { if (!store.restoreBackup()) toast('No valid backup was found'); } }));
  main.querySelector('#reset-data').addEventListener('click', () => confirmAction({ title: 'Restore bundled trip?', message: 'Your current edits will be backed up, then replaced by the original bundled JSON.', confirmLabel: 'Restore', onConfirm: () => store.reset() }));
  main.querySelector('#install-app').addEventListener('click', () => window.dispatchEvent(new CustomEvent('request-install')));
}

function renderNotFound(main) {
  main.innerHTML = `<div class="page">${pageHeader('Lost turn', 'That page is not on the route', 'The itinerary may have changed since this link was created.')}<a class="btn btn-primary" href="#/today">${icon('home', 'icon-sm')} Back to Today</a></div>`;
}

export function renderView(main, route) {
  const renderers = {
    dashboard: renderDashboard,
    today: renderToday,
    itinerary: renderItinerary,
    day: renderDay,
    places: renderPlaces,
    hotels: renderHotels,
    accommodation: renderHotels,
    restaurants: renderRestaurants,
    attractions: renderAttractions,
    driving: renderDriving,
    tube: renderTube,
    budget: renderBudget,
    expenses: renderBudget,
    checklist: renderChecklist,
    packing: renderPacking,
    notes: renderNotes,
    'travel-notes': renderNotes,
    flights: renderTravelModule,
    'car-rental': renderTravelModule,
    documents: renderTravelModule,
    weather: renderTravelModule,
    'emergency-contacts': renderTravelModule,
    companions: renderTravelModule,
    settings: renderSettings
  };
  const argument = ['accommodation', 'hotels'].includes(route.name) ? route.id : (route.id || route.name);
  (renderers[route.name] || renderNotFound)(main, argument);
  main.querySelectorAll('.segment').forEach(button => button.setAttribute('aria-pressed', String(button.classList.contains('active'))));
  main.focus({ preventScroll: true });
}
