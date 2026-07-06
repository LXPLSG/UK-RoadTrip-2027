/** Hash-based router that supports static hosting and offline deep links. */
class Router extends EventTarget {
  constructor() {
    super();
    window.addEventListener('hashchange', () => this.#emit());
  }

  start() {
    if (!location.hash) location.replace('#/today');
    else this.#emit();
  }

  current() {
    const parts = location.hash.replace(/^#\/?/, '').split('/').filter(Boolean);
    return { name: parts[0] || 'today', id: parts[1] || null };
  }

  #emit() {
    this.dispatchEvent(new CustomEvent('route', { detail: this.current() }));
  }
}

export const router = new Router();
