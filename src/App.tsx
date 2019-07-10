import * as React from 'react';
import { Header } from './components/header/Header';
import { ProvidersService } from './ProviderService';
import { networks } from './netowrks';
import { getPageStart } from './utils';
import { ZapProvider } from '@zapjs/provider';
import { TableContainer } from './components/main/TableContainer';
import Web3 from 'web3';

interface State {
	loading: string;
	error: string;
	total: number;
	items: {
		provider: ZapProvider;
		endpoints: string[];
	}[];
	netId: number;
	page: number;
	search: string;
	expanded: string;
}

const pageSize = 10;
const defaultNetwork = 42;

export class App extends React.PureComponent<any, State> {

	providersService: ProvidersService;

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
		};
		this.handleNetworkChange = this.handleNetworkChange.bind(this);
	}

	componentDidMount() {
		this.handleNetworkChange(42);
	}

	async getOracles() {
		const { page, search } = this.state;
		const start = getPageStart(page, pageSize);
		const {items, total} = await (search
			? this.providersService.search(search, start, false, pageSize)
			: this.providersService.getProviders(start, false, pageSize));
		this.setState({items, total});
	}

	async handleNetworkChange(netId) {
		const network = networks.find(e => e.networkId === netId);
		if (!network) return;
		this.setState({netId})
		const web3 = new Web3(network.networkProvider);
		await web3.eth.net.getId();
		this.providersService = new ProvidersService(netId, web3.eth.currentProvider, web3);
		this.setState({page: 1, search: ''}, () => {
			this.getOracles();
		});
	}

	render() {
		const { search, netId, items } = this.state;
		return (
			<React.Fragment>
				<Header search={search} netId={netId} onNetworkChange={this.handleNetworkChange} />
				<TableContainer items={items} />
			</React.Fragment>
		)
	}
}
