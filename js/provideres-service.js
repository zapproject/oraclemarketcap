const restrictedAddresses = [
  '0xaD0Adf0C81E9c18D5DE0D6D5555A909c6435062D',
  '0x2416002D127175BC2d627FAefdaA4186c7c49833',
  '0x47834a7533Eb6CB6F8ca1677405423e476cE3f31',
  '0x6Be845635029C8C8F44bc8d729624d0c41adCcDE'
];

class ProvidersService {

  constructor(networkId, networkProvider) {
    this.networkId = networkId;
    this.networkProvider = networkProvider;
    this.registry = new zapjs.ZapRegistry(this.networkOptions);
    this.bondage = new zapjs.ZapBondage(this.networkOptions);
    this.networkProvider = this.registry.provider.currentProvider;
    this.updateProvidersData();
    this.registry.listenNewProvider({}, () => { this.updateProvidersData(); });
    this.registry.listenNewCurve({}, () => { this.updateProvidersData(); });
    this.formatBondEvent = this.formatBondEvent.bind(this);
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

  async getProvidersByBoundDots() {
    const endpointsWithDots = await this.bondage.contract.getPastEvents('Bound', {
      fromBlock: 0,
      toBlock: 'latest',
    }).then(events => ProvidersService.groupEndpointsByProvider(ProvidersService.combineBondEvents(events.map(this.formatBondEvent)).sort(ProvidersService.sortByNumDots)));
    return endpointsWithDots;
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
    const sortedProvidersPromise = this.getProvidersByBoundDots();
    this.allProviderAddressesPromise = Promise.all([
      (this.registry.getAllProviders()) .then(addresses => addresses.filter(address => restrictedAddresses.indexOf(address) === -1)),
      sortedProvidersPromise,
    ]).then(([allProviders, providersSortedByDots]) => {
      // get some providers with known numDots and sort them
      return ProvidersService.sortItemsByNumDots(allProviders, providersSortedByDots, 'address');
    });
    // do not load titles for providers on the first run, only when requested
    this.allOraclesPromise = this.allProviderAddresses.then(providerAddresses => Promise.all(providerAddresses.map(address => this.loadProvider(address))));
    // this.endpointsPromise = Promise.all([this.allProviders, sortedProvidersPromise]).then(([providers, sortedProviders]) => this.updateEndpoints(providers, sortedProviders));
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

  static sortItemsByNumDots(allItems, itemsWithDots, returnField) {
    const items = [];
    for (let i = 0, len = itemsWithDots.length; i < len; i++) {
      const provider = itemsWithDots[i];
      if (allItems.indexOf(provider[returnField]) === -1) continue;
      items.push(provider[returnField]);
    }
    for (let i = 0, len = allItems.length; i < len; i++) {
      const provider = allItems[i];
      if (items.indexOf(provider) !== -1) continue;
      items.push(provider);
    }
    return items;
  }


  formatBondEvent(event) {
    const hexToUtf8 = this.bondage.provider.utils.hexToUtf8;
    return {
      endpoint: hexToUtf8(event.returnValues.endpoint),
      provider: event.returnValues.oracle,
      numDots: Number(event.returnValues.numDots),
    };
  }

  static groupEndpointsByProvider(endpoints) {
    const providers = [];
    const len = endpoints.length;
    for (let i = 0; i < len; i++) {
      const endpoint = endpoints[i];
      const index = ProvidersService.getIndexByAddress(providers, endpoint.provider);
      if (index !== -1) {
        providers[index].endpoints.push(endpoint);
        providers[index].numDots += endpoint.numDots;
        continue;
      }
      providers.push({
        address: endpoint.provider,
        endpoints: [endpoint],
        numDots: endpoint.numDots,
      });
    }
    return providers.sort(ProvidersService.sortByNumDots);
  }

  static getIndexByAddress(providers, address) {
    return ProvidersService.getIndexBy(providers, address, 'address');
  }

  static getIndexBy(items, value, field) {
    let i = items.length;
    while (i--) {
      if (items[i][field] === value) return i;
    }
    return -1;
  }

  static getEndpointByProviderAndEndpoint(endpoints, endpoint, provider) {
    let i = endpoints.length;
    while (i--) {
      if (endpoints[i].endpoint === endpoint && endpoints[i].provider === provider) return endpoints[i];
    }
    return null;
  }

  static combineBondEvents(events) {
    const endpoints = [];
    let i = events.length;
    while (i--) {
      const endpoint = ProvidersService.getEndpointByProviderAndEndpoint(endpoints, events[i].endpoint, events[i].provider);
      if (endpoint) {
        endpoint.numDots += events[i].numDots;
      } else {
        endpoints.push({
          endpoint: events[i].endpoint,
          provider: events[i].provider,
          curve: events[i].curve,
          numDots: events[i].numDots,
        });
      }
    }
    return endpoints;
  }

  static sortByNumDots(a, b) {
    return b.numDots - a.numDots;
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
