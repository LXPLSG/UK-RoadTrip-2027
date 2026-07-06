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
    this.#applyTheme();
  }

  update(mutator, message = 'Changes saved') {
    const next = clone(this.#data);
    mutator(next);
    repository.save(next);
    this.#data = next;
    this.dispatchEvent(new CustomEvent('change', { detail: { message } }));
  }

  replace(data, message = 'Trip data updated') {
    repository.save(data);
    this.#data = clone(data);
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
    if (key === 'theme') this.#applyTheme();
    this.dispatchEvent(new CustomEvent('preference', { detail: { key, value } }));
  }

  #applyTheme() {
    const theme = this.#preferences.theme || 'system';
    const dark = theme === 'dark' || (theme === 'system' && matchMedia('(prefers-color-scheme: dark)').matches);
    document.documentElement.dataset.theme = dark ? 'dark' : 'light';
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', dark ? '#141817' : '#f4f5f2');
  }
}

export const store = new Store();
