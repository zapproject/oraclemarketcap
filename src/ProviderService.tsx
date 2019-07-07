import { ZapRegistry } from '@zapjs/registry';
import { ZapProvider } from '@zapjs/provider';
import { ZapBondage } from '@zapjs/bondage/lib/src';
const { utf8ToHex, hexToUtf8 } = require('web3-utils');

const restrictedAddresses = [
  '0xaD0Adf0C81E9c18D5DE0D6D5555A909c6435062D',
  '0x2416002D127175BC2d627FAefdaA4186c7c49833',
  '0x47834a7533Eb6CB6F8ca1677405423e476cE3f31',
  '0x6Be845635029C8C8F44bc8d729624d0c41adCcDE'
];

export class ProvidersService {
  private registry: ZapRegistry;
  private bondage: ZapBondage;
  private endpointsPromise: Promise<Array<{provider: string; endpoints: string[]}>>;
  private allOraclesPromise: Promise<ZapProvider[]>;
  private allProviderAddressesPromise: Promise<string[]>;

  constructor(private networkId, private networkProvider) {
    this.registry = new ZapRegistry(this.networkOptions);
    this.bondage = new ZapBondage(this.networkOptions);
    this.updateProvidersData();
    this.registry.listenNewProvider({}, () => { this.updateProvidersData(); });
    this.registry.listenNewCurve({}, () => { this.updateProvidersData(); });
  }

  private get allEndpoints(): Promise<Array<{provider: string; endpoints: string[]}>> {
    return this.endpointsPromise;
  }

  get allProviders(): Promise<ZapProvider[]> {
    return this.allOraclesPromise;
  }

  get allProvidersWithTitles(): Promise<ZapProvider[]> {
    return this.allProviders.then(providers => this.providersWithTitles(providers));
  }

  get allProviderAddresses(): Promise<string[]> {
    return this.allProviderAddressesPromise;
  }

  get allAddresses(): Promise<string[]> {
    return this.registry.getAllProviders() as Promise<string[]>;
  }

  private async providersWithTitles(providers: ZapProvider[]): Promise<ZapProvider[]> {
    await Promise.all(providers.filter(provider => !provider.title).map((provider: ZapProvider) => provider.getTitle()));
    return providers;
  }

  private updateProvidersData() {
    this.allProviderAddressesPromise = (this.registry.getAllProviders() as Promise<string[]>)
      .then(addresses => addresses.filter(address => restrictedAddresses.indexOf(address) === -1));
    // do not load titles for providers on the first run, only when requested
    this.allOraclesPromise = this.allProviderAddresses.then(providerAddresses => Promise.all(providerAddresses.map(address => this.loadProvider(address))));
    this.endpointsPromise = this.allProviders.then(providers => this.updateEndpoints(providers));
  }

  private async updateEndpoints(providers: ZapProvider[]): Promise<Array<{provider: string; endpoints: string[]}>> {
    const endpoints: string[][] = await Promise.all(providers.map(provider => provider.getEndpoints()));
    return providers.map((provider, index) => ({provider: provider.providerOwner, endpoints: endpoints[index]}));
  }

  loadProvider(owner: string): ZapProvider {
    return new ZapProvider(owner, this.networkOptions);
  }

  private getBoundDots(account: string, provider: string, endpoints: string[]): Promise<number[]> {
    return Promise.all(endpoints.map(endpoint => this.bondage.contract.methods.getBoundDots(account, provider, utf8ToHex(endpoint)).call().then(Number)));
  }

  async getProvidersBonded(account, search?): Promise<{items: Array<{provider: ZapProvider; endpoints: string[]; dots: number[]}>; total: number}> {
    const providersWithEndpoint: Array<{address: string; endpoints: string[]}> = await this.bondage.contract.getPastEvents('Bound', {
      filter: {holder: account},
      fromBlock: 0,
      toBlock: 'latest',
    }).then(eventes => eventes.map(formatBondEvent)).then(groupEndpointsByProvider);
    const providers = providersWithEndpoint.map(provider => this.loadProvider(provider.address));
    // load titles and bound dots in parallel
    const [_, allDots] = await Promise.all([
      this.providersWithTitles(providers),
      Promise.all(providersWithEndpoint.map(provider => this.getBoundDots(account, provider.address, provider.endpoints))),
    ]);
    const filterEndpointsWithDotsByDots = endpointWithDots => endpointWithDots.dots > 0;
    const filterEndpointsWithDotsBySearch = endpointWithDots => endpointWithDots.endpoint.indexOf(search) !== -1;
    const sortEndpointsWithDots = (endpointWithDotsA, endpointWithDotsB) => endpointWithDotsB.dots - endpointWithDotsA.dots;
    const items: Array<{provider: ZapProvider; endpoints: string[]; dots: number[]}> = [];
    providers.forEach((provider, providerIndex) => {
      const allEndpointsWithDots: Array<{endpoint: string; dots: number}> = providersWithEndpoint[providerIndex].endpoints
        .map((endpoint, endpointIndex) => ({
          endpoint,
          dots: allDots[providerIndex][endpointIndex],
        }))
        .filter(filterEndpointsWithDotsByDots)
        .sort(sortEndpointsWithDots);
      const searchEndpointsWithDots = search ? allEndpointsWithDots.filter(filterEndpointsWithDotsBySearch) : [];
      // if no endpoint match the search, but provider matches, show all it's endpoints
      const endpointsWithDots = searchEndpointsWithDots.length ? searchEndpointsWithDots : allEndpointsWithDots;
      if (
        !!search
        && !searchEndpointsWithDots.length
        && provider.title.toLocaleLowerCase().indexOf(search) === -1
        && provider.providerOwner.toLocaleLowerCase().indexOf(search) === -1
      ) return;
      const dots = [];
      const endpoints = [];
      for (let i = 0, len = endpointsWithDots.length; i < len; i++) {
        dots.push(endpointsWithDots[i].dots);
        endpoints.push(endpointsWithDots[i].endpoint);
      }
      items.push({ provider, endpoints, dots });
    });
    return {
      items,
      total: items.length,
    }
  }

  // TODO: For backend service return provider address and provider title only instead of provider
  async getProviders(start = 0, limit?: number): Promise<{items: Array<{provider: ZapProvider, endpoints: string[]}>, total: number}> {
    const providers = await this.allProviders;
    const allEndpoints = await this.allEndpoints;
    // only get title for requested providers
    const pageProviders = await this.providersWithTitles(limit ? providers.slice(start, start + limit) : providers.slice(start));
    return {
      items: pageProviders.map(provider => {
        const endpoints = ProvidersService.getEndpointsByOracleAddress(allEndpoints, provider.providerOwner);
        return {provider, endpoints};
      }),
      total: providers.length,
    };
  }

  private static getEndpointsByOracleAddress(endpoints: Array<{provider: string; endpoints: string[]}>, address: string) {
    let i = endpoints.length;
    while (i--) {
      if (endpoints[i].provider === address) return endpoints[i].endpoints;
    }
    return [];
  }

  // TODO: For backend service return provider address and provider title only instead of provider
  async search(text, start = 0, limit?: number): Promise<{items: Array<{provider: ZapProvider, endpoints: string[]}>, total: number}> {
    if (!text.length) this.getProviders(start, limit);
    await this.allProviders;
    const [allEndpoints, providers] = await Promise.all([
      this.allEndpoints,
      this.allProvidersWithTitles, // for search we need titles of all providers
    ]);
    const filteredOracles: Array<{provider: ZapProvider, endpoints: string[]}> = [];
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
      handleIncoming: (data: string) => {
        console.log('handleIncoming', data);
      },
      handleUnsubscription: (data: string) => {
        console.log('handleUnsubscription', data);
      },
      handleSubscription: (data: string) => {
        console.log('handleSubscription', data);
      },
    };
    return { networkId: this.networkId, networkProvider: this.networkProvider, handler };
  }
}


function formatBondEvent({returnValues}): {endpoint: string; provider: string} {
  return {
    endpoint: hexToUtf8(returnValues.endpoint) as string,
    provider: returnValues.oracle as string,
  };
}

function groupEndpointsByProvider(endpoints: Array<{endpoint: string; provider: string}>): Array<{address: string; endpoints: string[]}> {
  const groupEndpoints: string[] = [];
  const providers = [];
  let i = endpoints.length;
  while (i--) {
    const endpoint = endpoints[i];
    if (groupEndpoints.indexOf(endpoint.provider + endpoint.endpoint) !== -1) continue;
    const provider = getByAddress(providers, endpoint.provider);
    if (provider) {
      provider.endpoints.push(endpoint.endpoint);
    } else {
      providers.push({address: endpoint.provider, endpoints: [endpoint.endpoint] });
    }
    groupEndpoints.push(endpoint.provider + endpoint.endpoint);
  }
  return providers;
}

export function getByAddress(providers, address) {
  let i = providers.length;
  while (i--) {
    if (providers[i].address === address) return providers[i];
  }
  return null;
}