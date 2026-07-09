/** Adapter registry that selects providers by capability instead of UI knowledge. */
import { IntegrationError, assertAdapter } from './contracts.js';

export class ProviderRegistry {
  #providers = new Map();
  #preferences = new Map();

  register(adapter) {
    const provider = assertAdapter(adapter);
    this.#providers.set(provider.id, provider);
    provider.capabilities.forEach(capability => {
      if (!this.#preferences.has(capability)) this.#preferences.set(capability, provider.id);
    });
    return this;
  }

  setPreferredProvider(capability, providerId) {
    const provider = this.#providers.get(providerId);
    if (!provider || !provider.supports(capability)) {
      throw new IntegrationError(providerId, capability, 'Provider does not support the requested capability.');
    }
    this.#preferences.set(capability, providerId);
  }

  providerFor(capability) {
    const preferred = this.#preferences.get(capability);
    const provider = preferred ? this.#providers.get(preferred) : null;
    if (provider?.supports(capability)) return provider;
    const fallback = [...this.#providers.values()].find(adapter => adapter.supports(capability));
    if (!fallback) throw new IntegrationError('none', capability);
    return fallback;
  }

  list() {
    return [...this.#providers.values()].map(provider => ({
      id: provider.id,
      name: provider.name,
      capabilities: [...provider.capabilities],
      notes: provider.notes
    }));
  }
}
