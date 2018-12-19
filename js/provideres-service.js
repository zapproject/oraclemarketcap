class ProvidersService {

  constructor(networkId, networkProvider) {
    this.networkId = networkId;
    this.networkProvider = networkProvider;
    this.registry = new zapjs.ZapRegistry(this.networkOptions);
    this.networkProvider = this.registry.provider.currentProvider;
    this.updateProvidersData();
    this.registry.listenNewProvider({}, () => { this.updateProvidersData(); });
    this.registry.listenNewCurve({}, () => { this.updateProvidersData(); });
  }

  get allProviders() {
    return this.allOraclesPromise;
  }

  get allProvidersWithTitles() {
    return this.allProviders.then(providers => this.providersWithTitles(providers));
  }

  get allProvidersWithEndpoints() {
    return this.allProviders.then(providers => this.providersWithEndpoints(providers));
  }

  get allProviderAddresses() {
    return this.allProviderAddressesPromise;
  }

  get allAddresses() {
    return this.registry.getAllProviders();
  }

  async providersWithTitles(providers) {
    await Promise.all(providers.filter(provider => !provider.title).map((provider) => provider.getTitle()));
    return providers;
  }

  async providersWithEndpoints(providers) {
    await Promise.all(providers.filter(provider => !provider.endpoints).map((provider) => provider.getEndpoints()));
    return providers;
  }

  updateProvidersData() {
    this.allProviderAddressesPromise = this.registry.getAllProviders();
    // do not load titles for providers on the first run, only when requested
    this.allOraclesPromise = this.allProviderAddresses.then(providerAddresses => Promise.all(providerAddresses.map(address => this.loadProvider(address))));
  }

  loadProvider(owner) {
    return new Provider(owner, this.networkOptions);
  }

  // TODO: For backend service return provider address and provider title only instead of provider
  async getProviders(start = 0, limit) {
    const providers = await this.allProviders;
    // only get title for requested providers
    const pageProviders = limit ? providers.slice(start, start + limit) : providers.slice(start);
    await Promise.all([
      this.providersWithTitles(pageProviders),
      this.providersWithEndpoints(pageProviders),
    ]);
    return {
      items: pageProviders.map(provider => ({provider, endpoints: provider.endpoints})),
      total: providers.length,
    };
  }

  // TODO: For backend service return provider address and provider title only instead of provider
  async search(text, start = 0, limit) {
    if (!text.length) this.getProviders(start, limit);
    await this.allProviders;
    const [_, providers] = await Promise.all([
      this.allProvidersWithEndpoints,
      this.allProvidersWithTitles, // for search we need titles of all providers
    ]);
    const filteredOracles = providers.map(provider => {
      const endpoints = provider.endpoints.filter(endpoint => endpoint && endpoint.toLowerCase().indexOf(text) !== -1);
      if (
        !endpoints.length
        && provider.title.toLocaleLowerCase().indexOf(text) === -1
        && provider.providerOwner.toLocaleLowerCase().indexOf(text) === -1
      ) return null;
      return {
        provider,
        endpoints,
      };
    }).filter(e => !!e);
    return {
      items: limit ? filteredOracles.slice(start, start + limit) : filteredOracles.slice(start),
      total: filteredOracles.length,
    };
  }

  get networkOptions() {
    const handler = {
      handleIncoming: (data) => {
        console.log('handleIncoming', data);
      },
      handleUnsubscription: (data) => {
        console.log('handleUnsubscription', data);
      },
      handleSubscription: (data) => {
        console.log('handleSubscription', data);
      },
    };
    return { networkId: this.networkId, networkProvider: this.networkProvider, handler };
  }
}

class Provider extends zapjs.ZapProvider {
	constructor(owner, options) {
		super(owner, options);
		this.endpoints = null;
	}
	async getEndpoints() {
		if (this.endpoints) return this.endpoints;
    const endpoints = await this.zapRegistry.getProviderEndpoints(this.providerOwner);
    this.endpoints = endpoints;
    return this.endpoints;
	}
}