/** Admin CMS boundary for future authenticated editing over the same JSON model. */
import { clone } from './utils.js';
import { validateTripData } from './validator.js';

export class AdminCmsDraft {
  constructor(data) {
    this.data = clone(data);
  }

  list(collection) {
    const items = this.data[collection];
    return Array.isArray(items) ? clone(items) : [];
  }

  upsert(collection, item) {
    if (!Array.isArray(this.data[collection])) throw new Error(`Unknown collection: ${collection}`);
    const index = this.data[collection].findIndex(existing => existing.id === item.id);
    if (index >= 0) this.data[collection][index] = { ...this.data[collection][index], ...item };
    else this.data[collection].push(item);
    return this;
  }

  remove(collection, id) {
    if (!Array.isArray(this.data[collection])) throw new Error(`Unknown collection: ${collection}`);
    this.data[collection] = this.data[collection].filter(item => item.id !== id);
    return this;
  }

  validate() {
    return validateTripData(this.data);
  }

  publish() {
    const result = this.validate();
    if (!result.valid) throw new Error(result.errors.join(' '));
    return clone(this.data);
  }
}

export function createAdminDraft(data) {
  return new AdminCmsDraft(data);
}
