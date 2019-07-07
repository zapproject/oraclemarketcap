import * as React from 'react';
import { Header } from './components/header/Header';
import { ProvidersService } from './ProviderService';
import { networks } from './netowrks';
import { getPageStart } from './utils';
import { ZapProvider } from '@zapjs/provider';

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
			? this.providersService.search(search, start, pageSize)
			: this.providersService.getProviders(start, pageSize));
		this.setState({items, total});
	}

	handleNetworkChange(netId) {
		const network = networks.find(e => e.networkId === netId);
		if (!network) return;
		this.setState({netId})
		this.providersService = new ProvidersService(netId, network.networkProvider);
		this.setState({page: 1, search: ''}, () => {
			this.getOracles();
		});
	}

	render() {
		const { search, netId } = this.state;
		return (
			<React.Fragment>
				<Header search={search} netId={netId} onNetworkChange={this.handleNetworkChange} />
			</React.Fragment>
		)
	}
}
