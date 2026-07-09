/** Notification infrastructure with typed rules and a future Firebase bridge point. */
import { daysUntil } from './utils.js';

export const NOTIFICATION_TYPES = Object.freeze([
  'price-drop',
  'booking-opens',
  'cancellation-deadline',
  'trip-countdown',
  'weather-alert',
  'road-closure',
  'reservation-reminder'
]);

const TYPE_LABELS = Object.freeze({
  'price-drop': 'Price Drop',
  'booking-opens': 'Booking Opens',
  'cancellation-deadline': 'Cancellation Deadline',
  'trip-countdown': 'Trip Countdown',
  'weather-alert': 'Weather Alert',
  'road-closure': 'Road Closure',
  'reservation-reminder': 'Reservation Reminder'
});

function notification(id, type, title, body, dueDate = '') {
  return { id, type, label: TYPE_LABELS[type] || type, title, body, dueDate, status: 'infrastructure' };
}

export class NotificationEngine {
  constructor({ firebase = null } = {}) {
    this.firebase = firebase;
  }

  /** Generate local reminders from trip data; push delivery can subscribe here later. */
  list(data) {
    const generated = [];
    const countdown = daysUntil(data.trip.startDate);
    generated.push(notification(
      'generated-trip-countdown',
      'trip-countdown',
      countdown > 0 ? `${countdown} days until departure` : 'Trip window is active',
      'Countdown notifications are prepared for future opt-in delivery.',
      data.trip.startDate
    ));
    (data.places || []).filter(place => place.reservationDate).forEach(place => {
      generated.push(notification(
        `generated-reservation-${place.id}`,
        'reservation-reminder',
        place.name,
        `${place.reservationDate}${place.reservationTime ? ` at ${place.reservationTime}` : ''}`,
        place.reservationDate
      ));
    });
    return [...(data.notifications || []), ...generated];
  }

  /** FCM adapter seam: callers can inject Firebase later without changing views. */
  async registerPushClient() {
    if (!this.firebase) return { supported: false, token: null };
    return this.firebase.register();
  }
}

export const notificationEngine = new NotificationEngine();
