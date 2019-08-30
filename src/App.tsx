import * as React from 'react';
import { Header } from './components/header/Header';
import { networks } from './netowrks';
import { ZapProvider } from '@zapjs/provider';
import Web3 from 'web3';
import { TableContainer } from './components/table/TableContainer';
import { OraclesPagination } from 'zap-extras/lib/ui/shared/pagination/OraclesPagination';
import 'zap-extras/lib/ui/shared/pagination/oracles-pagination.css';
import { getPageStart, getTotalPages, getPages, parseHash } from 'zap-extras/lib/ui/shared/pagination/utils';
import marked from 'marked';
import { Dialog } from './components/dialog/Dialog';
import { ProvidersService } from 'zap-extras/lib/ethereum/providers-service';
import { getUrlText, getProviderParam } from 'zap-extras/lib/ethereum/params-utils';

interface State {
	loading: string;
	error: string;
	total: number;
	items: Array<{
		provider: ZapProvider;
		endpoints: string[];
	}>;
	netId: number;
	page: number;
	search: string;
	expanded: string;
	endpoint: string;
	dialogHTML: string;
}

const pageSize = 10;
const isMetamaskAvailable = !!((window as any).ethereum || (window as any).web3);
const defaultNetwork = isMetamaskAvailable ? -1 : networks[1].networkId;

export class App extends React.PureComponent<any, State> {

	providersService: ProvidersService;
	firstExpand = true;

	constructor(props) {
		super(props);
		this.state = {
			loading: '',
			error: '',
			total: 0,
			items: [],
			netId: defaultNetwork,
			page: 1,
			search: '',
			expanded: '',
			endpoint: '',
			dialogHTML: '',
		};
		this.handleNetworkChange = this.handleNetworkChange.bind(this);
		this.locationChanged = this.locationChanged.bind(this);
	}

	componentDidMount() {
		this.handleNetworkChange(this.state.netId);
		window.addEventListener('hashchange', this.locationChanged);
	}

	async locationChanged() {
		const hash = parseHash();
		const { page, search } = this.state;
		const selectedOracle = hash.expandedAddress.slice(0, 42);
		const selectedEndpoint = hash.expandedAddress.slice(42);
		this.setState({
			page: hash.page,
			expanded: selectedOracle,
			search: hash.search,
			endpoint: selectedEndpoint,
			dialogHTML: '',
		}, () => {
			this.showDialog();
			if (this.firstExpand || hash.page !== page || hash.search !== search) {
				this.firstExpand = false;
				this.setState({items: []});
				this.getOracles();
			}
		});
		// this.handleExpandAndNavigate(hash.expandedAddress, expandedAddress);
	}

	async showDialog() {
		const { endpoint, expanded, items } = this.state;
		let i = items.length;
		if (!endpoint || !expanded) return;
		let provider: ZapProvider = null;
		while (i--) {
			if (items[i].provider.providerOwner !== expanded) continue;
			provider = items[i].provider;
			break;
		}
		if (!provider) return;
		const url = await getProviderParam(provider, endpoint + '.md')
		if (!url) return;
		// document.documentElement.classList.add('dialog-openned');
		this.setState({
			dialogHTML: `<p>Loading info ...<br>Provider: ${provider.title} ${expanded}` + (endpoint ? `<br>Endpoint: ${endpoint}</p>` : ''),
		});
		getUrlText(url).then(response => {
			this.setState({
				dialogHTML: marked(response),
			});
		}).catch(error => {
			this.setState({
				dialogHTML: `<p>${error.message}</p>`
			});
		});
	}

	async getOracles() {
		const { page, search } = this.state;
		const start = getPageStart(page, pageSize);
		const {items, total} = await (search
			? this.providersService.search(search, start, false, pageSize, true)
			: this.providersService.getProviders(start, false, pageSize, true));
		this.setState({items, total});
	}

	async handleNetworkChange(netId) {
		const network = networks.find(e => e.networkId === netId);
		if (!network) return;
		this.setState({netId});
		let web3;
		if (netId === -1) {
			try {

				if ((window as any).ethereum) {
					web3 = new Web3((window as any).ethereum);
					// await (window as any).ethereum.enable();
				} else if ((window as any).web3) {
					web3 = new Web3((window as any).web3.currentProvider);
				}
			} catch (e) {
				console.log(e);
			}
		} else {
			web3 = new Web3(network.networkProvider);
		}
		const web3NetId = await web3.eth.net.getId();
		this.providersService = new ProvidersService(web3NetId, web3.eth.currentProvider, web3);
		this.locationChanged();
	}

	render() {
		const { search, netId, items, expanded, total, page, dialogHTML } = this.state;
		const pages = getPages(page, getTotalPages(total, pageSize));
		return (
			<React.Fragment>
				<Header search={search} netId={netId} onNetworkChange={this.handleNetworkChange} />
				<TableContainer items={items} expanded={expanded} />
				<OraclesPagination baseUrl="#" search={search} currentPage={page} pages={pages} />
				{!!dialogHTML && <Dialog onClose={() => {this.setState({dialogHTML: ''})}} html={dialogHTML} />}
			</React.Fragment>
		)
	}
}
