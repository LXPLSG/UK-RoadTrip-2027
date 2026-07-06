/** Resolves explicit and operating-system themes and keeps browser chrome in sync. */
class ThemeManager extends EventTarget {
  #choice = 'system';
  #media = window.matchMedia('(prefers-color-scheme: dark)');

  constructor() {
    super();
    this.#media.addEventListener('change', () => {
      if (this.#choice === 'system') this.#apply();
    });
  }

  initialise(choice = 'system') {
    this.set(choice, false);
  }

  set(choice, announce = true) {
    this.#choice = ['light', 'dark', 'system'].includes(choice) ? choice : 'system';
    this.#apply();
    if (announce) this.dispatchEvent(new CustomEvent('change', { detail: { choice: this.#choice, effective: this.effective } }));
  }

  get choice() { return this.#choice; }

  get effective() {
    return this.#choice === 'system' ? (this.#media.matches ? 'dark' : 'light') : this.#choice;
  }

  #apply() {
    const effective = this.effective;
    document.documentElement.dataset.theme = effective;
    document.documentElement.style.colorScheme = effective;
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', effective === 'dark' ? '#141817' : '#f4f5f2');
  }
}

export const themeManager = new ThemeManager();
