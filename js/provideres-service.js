const restrictedAddresses = [
  '0xaD0Adf0C81E9c18D5DE0D6D5555A909c6435062D',
  '0x2416002D127175BC2d627FAefdaA4186c7c49833',
  '0x47834a7533Eb6CB6F8ca1677405423e476cE3f31',
  '0x6Be845635029C8C8F44bc8d729624d0c41adCcDE'
];

var ProvidersService = (function() {
  var hexToUtf8;
  return class ProvidersService {
    constructor(networkId, networkProvider) {
      this.networkId = networkId;
      this.networkProvider = networkProvider;



      this.registry = new ZapRegistry(this.networkOptions);
      this.bondage = new ZapBondage(this.networkOptions);

      this.networkProvider = this.registry.provider.currentProvider;

      hexToUtf8 = this.registry.provider.utils.hexToUtf8;

      this.updateProvidersData();
      this.registry.listenNewProvider({}, () => { this.updateProvidersData(); });
      this.registry.listenNewCurve({}, () => { this.updateProvidersData(); });
    }

    get allEndpointWithBroker() {
      return this.allEndpointsWithBrokerPromise;
    }

    get allEndpoints() {
      return this.endpointsPromise;
    }

    get allProviders() {
      return this.allOraclesPromise;
    }

    get currentProvider() {
      return this.networkProvider;
    }

    get allProvidersWithTitles() {
      return this.allProviders.then(providers => this.providersWithTitles(providers));
    }

    /* get allProvidersWithEndpoints() {
      return this.allProviders.then(providers => this.providersWithEndpoints(providers));
    } */

    get allProviderAddresses() {
      return this.allProviderAddressesPromise;
    }

    /* get allAddresses() {
      return this.registry.getAllProviders();
    } */

    async providersWithTitles(providers) {
      await Promise.all(providers.filter(provider => !provider.title).map((provider) => provider.getTitle()));
      return providers;
    }

    async getProvidersWithTitles(withBroker, emptyProviders) {
      const providers = await this.allProvidersWithTitles;
      if (!withBroker) return providers;
      const [providerAddressesFromBrokerEndpoints, providerAddressesFromEndpoints] = await Promise.all([
        this.allEndpointWithBroker.then(endpoints => endpoints.map(e => e.provider)),
        this.allEndpoints.then(endpoints => endpoints.filter(e => e.endpoints.length > 0).map(e => e.provider)),
      ]);
      return providers.filter(provider => {
        const hasBorkerEndpoint = providerAddressesFromBrokerEndpoints.indexOf(provider.providerOwner) !== -1;
        const hasEndpoint = providerAddressesFromEndpoints.indexOf(provider.providerOwner) !== -1;
        return emptyProviders ? (hasBorkerEndpoint || !hasEndpoint) : hasBorkerEndpoint;
      });
    }

    async getProviderEndpoints(provider, withBroker) {
      const endpoints = await provider.getEndpoints();
      if (!withBroker) return endpoints;
      const brokerEndpoints = await this.allEndpointWithBroker.then(endpoints => endpoints.filter(e => e.provider === provider.providerOwner).map(e => e.endpoint));
      return brokerEndpoints;
    }

    isBrokerProvider(provider, endpoints, allBrokerEndpoints) {
      const providerBrokerEndpoints = allBrokerEndpoints.filter(e => e.provider === provider.providerOwner).map(e => e.endpoint);
      const nonBrokerEndpoints = [];
      const brokerEndpoints = [];
      endpoints.forEach(e => {
        const isBrokerEndpoint = providerBrokerEndpoints.indexOf(e) !== -1;
        (isBrokerEndpoint ? brokerEndpoints : nonBrokerEndpoints).push(e);
      });
      return {provider, nonBrokerEndpoints, brokerEndpoints};
    }

    async getBrokerEndpoints() {
      const endpoints = await this.registry.contract.getPastEvents('NewCurve', {
        fromBlock: 0,
        toBlock: 'latest',
      }).then(events => events.filter(filterCurveEventWithBroker).map(formatCurveEvent)).catch(() => []);
      return endpoints;
    }

    async getProvidersByBoundDots() {
      const endpointsWithDots = await this.bondage.contract.getPastEvents('Bound', {
        fromBlock: 0,
        toBlock: 'latest',
      }).then(events => groupEndpointsByProvider(combineBondEvents(events.map(formatBondEvent)).sort(sortByNumDots)));
      return endpointsWithDots;
    }

    updateProvidersData() {
      const sortedProvidersPromise = this.getProvidersByBoundDots();
      this.allProviderAddressesPromise = Promise.all([
        this.registry.getAllProviders().then(addresses => addresses.filter(address => restrictedAddresses.indexOf(address) === -1)),
        sortedProvidersPromise,
      ]).then(([allProviders, providersSortedByDots]) => {
        // get some providers with known numDots and sort them
        return sortItemsByNumDots(allProviders, providersSortedByDots, 'address');
      });
      // do not load titles for providers on the first run, only when requested
      this.allOraclesPromise = this.allProviderAddresses.then(providerAddresses => Promise.all(providerAddresses.map(address => this.loadProvider(address))));
      this.endpointsPromise = Promise.all([this.allProviders, sortedProvidersPromise]).then(([providers, sortedProviders]) => this.updateEndpoints(providers, sortedProviders));
      this.allEndpointsWithBrokerPromise = this.getBrokerEndpoints();
    }

    async updateEndpoints(providers, sortedProvidersWithEndpoints) {
      const endpoints = await Promise.all(providers.map(provider => provider.getEndpoints().catch(e => '')));
      return providers.map((provider, index) => {
        const sortedProvider = getByAddress(sortedProvidersWithEndpoints, provider.providerOwner);
        return {
          provider: provider.providerOwner,
          endpoints: sortItemsByNumDots(endpoints[index], sortedProvider ? sortedProvider.endpoints : [], 'endpoint')
        };
      });
    }

    loadProvider(owner) {
      // return new Provider(owner, this.networkOptions);
      return new ZapProvider(owner, this.networkOptions);
    }

    // TODO: For backend service return provider address and provider title only instead of provider
    async getProviders(start = 0, withBroker, limit) {
      const [allProviders, allEndpoints, brokerEndpoints] = await Promise.all([
        this.allProviders,
        this.allEndpoints,
        this.allEndpointWithBroker,
      ]);
      const providersWithEndpoints = allProviders.map(provider => ({provider, endpoints: ProvidersService.getEndpointsByOracleAddress(allEndpoints, provider.providerOwner)}));
      const providersWithBrokerEndpoints = providersWithEndpoints.map(e => this.isBrokerProvider(e.provider, e.endpoints, brokerEndpoints));
      const providers = [];
      const endpoints = []
      providersWithBrokerEndpoints.forEach(e => {
        if (withBroker && e.brokerEndpoints.length) {
          providers.push(e.provider);
          endpoints.push(e.brokerEndpoints);
        }
        if (!withBroker && (e.nonBrokerEndpoints.length || (!e.nonBrokerEndpoints.length && !e.brokerEndpoints.length))) {
          providers.push(e.provider);
          endpoints.push(e.nonBrokerEndpoints);
        }
      });
      // only get title for requested providers
      const pageProviders = await this.providersWithTitles(limit ? providers.slice(start, start + limit) : providers.slice(start));
      const pageEndpoints = limit ? endpoints.slice(start, start + limit) : endpoints.slice(start)
      return {
        items: pageProviders.map((provider, index) => {
          return {provider, endpoints: pageEndpoints[index]};
        }),
        total: providers.length,
      };
    }

    static getEndpointsByOracleAddress(endpoints, address) {
      let i = endpoints.length;
      while (i--) {
        if (endpoints[i].provider === address) return endpoints[i].endpoints;
      }
      return [];
    }

    // TODO: For backend service return provider address and provider title only instead of provider
    async search(text, start = 0, withBroker, limit) {
      if (!text.length) this.getProviders(start, withBroker, limit);
      await this.allProviders;
      const [allEndpoints, providers] = await Promise.all([
        this.allEndpoints,
        this.allProvidersWithTitles, // for search we need titles of all providers
      ]);
      const filteredOracles = [];
      providers.forEach(provider => {
        const allProviderEndpoints = ProvidersService.getEndpointsByOracleAddress(allEndpoints, provider.providerOwner)
        const searchEndpoints = allProviderEndpoints.filter(endpoint => endpoint.toLowerCase().indexOf(text) !== -1);
        // if no endpoint match the search, but provider matches, show all it's endpoints
        const endpoints = searchEndpoints.length ? searchEndpoints : allProviderEndpoints;
        if (
          !searchEndpoints.length
          && provider.title.toLocaleLowerCase().indexOf(text) === -1
          && provider.providerOwner.toLocaleLowerCase().indexOf(text) === -1
        ) return;
        filteredOracles.push({
          provider,
          endpoints,
        });
      });
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

  /* class Provider extends ZapProvider {
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
  } */


  function filterCurveEventWithBroker({returnValues}) {
    return returnValues.broker && returnValues.broker !== '0x0000000000000000000000000000000000000000';
  }

  function formatCurveEvent({returnValues}) {
    let endpoint;
    try {
      endpoint = hexToUtf8(returnValues.endpoint);
    } catch (e) {
      endpoint = returnValues.endpoint;
    }
    return {
      endpoint,
      provider: returnValues.provider,
      broker: returnValues.broker,
      curve: returnValues.curve,
      numDots: 0,
    };
  }

  function sortItemsByNumDots(allItems, itemsWithDots, returnField) {
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


  function formatBondEvent({returnValues}) {
    return {
      endpoint: hexToUtf8(returnValues.endpoint),
      provider: returnValues.oracle,
      numDots: Number(returnValues.numDots),
    };
  }

  function groupEndpointsByProvider(endpoints) {
    const providers = [];
    const len = endpoints.length;
    for (let i = 0; i < len; i++) {
      const endpoint = endpoints[i];
      const index = getIndexByAddress(providers, endpoint.provider);
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
    return providers.sort(sortByNumDots);
  }

  function getIndexByAddress(providers, address) {
    return getIndexBy(providers, address, 'address');
  }

  function getByAddress(providers, address) {
    return providers[getIndexBy(providers, address, 'address')];
  }

  function getIndexBy(items, value, field) {
    let i = items.length;
    while (i--) {
      if (items[i][field] === value) return i;
    }
    return -1;
  }

  function getEndpointByProviderAndEndpoint(endpoints, endpoint, provider) {
    let i = endpoints.length;
    while (i--) {
      if (endpoints[i].endpoint === endpoint && endpoints[i].provider === provider) return endpoints[i];
    }
    return null;
  }

  function combineBondEvents(events) {
    const endpoints = [];
    let i = events.length;
    while (i--) {
      const endpoint = getEndpointByProviderAndEndpoint(endpoints, events[i].endpoint, events[i].provider);
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

  function sortByNumDots(a, b) {
    return b.numDots - a.numDots;
  }
}());