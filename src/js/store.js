/** In-memory application state with validated, persistent update operations. */
import { clone } from './utils.js';
import { repository } from './repository.js';

class Store extends EventTarget {
  #data = null;
  #preferences = {};

  get data() { return this.#data; }
  get preferences() { return this.#preferences; }

  async initialise() {
    this.#data = await repository.initialise();
    this.#preferences = repository.getPreferences();
  }

  update(mutator, message = 'Changes saved') {
    const next = clone(this.#data);
    mutator(next);
    repository.save(next);
    this.#data = next;
    this.dispatchEvent(new CustomEvent('change', { detail: { message } }));
  }

  replace(data, message = 'Trip data updated') {
    const prepared = repository.prepare(data);
    repository.save(prepared);
    this.#data = clone(prepared);
    this.dispatchEvent(new CustomEvent('change', { detail: { message } }));
  }

  reset() {
    this.#data = repository.reset();
    this.dispatchEvent(new CustomEvent('change', { detail: { message: 'Bundled trip restored' } }));
  }

  restoreBackup() {
    const data = repository.restoreBackup();
    if (!data) return false;
    this.#data = data;
    this.dispatchEvent(new CustomEvent('change', { detail: { message: 'Backup restored' } }));
    return true;
  }

  setPreference(key, value) {
    this.#preferences[key] = value;
    repository.savePreferences(this.#preferences);
    this.dispatchEvent(new CustomEvent('preference', { detail: { key, value } }));
  }
}

export const store = new Store();
