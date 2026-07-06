/** Resolves automatic or user-selected Planning and Travel product modes. */
class ModeManager extends EventTarget {
  #choice = 'automatic';

  initialise(choice = 'automatic', data) { this.set(choice, data, false); }

  set(choice, data, announce = true) {
    this.#choice = ['automatic', 'planning', 'travel'].includes(choice) ? choice : 'automatic';
    document.documentElement.dataset.mode = this.effective(data);
    if (announce) this.dispatchEvent(new CustomEvent('change', { detail: { choice: this.#choice, effective: this.effective(data) } }));
  }

  get choice() { return this.#choice; }

  effective(data) {
    if (this.#choice !== 'automatic') return this.#choice;
    const today = new Date().toISOString().slice(0, 10);
    return today >= data.trip.startDate && today <= data.trip.endDate ? 'travel' : 'planning';
  }
}

export const modeManager = new ModeManager();
