export const networks = [
	{
		name: 'Metamask',
		networkProvider: '',
		networkId: -1
	},
	{
		name: 'Mainnet',
		networkProvider: 'wss://mainnet.infura.io/ws',
		networkId: 1,
		// disabled: true
	},
	{
		name: 'Kovan',
		networkProvider: 'wss://kovan.infura.io/ws',
		networkId: 42
	},
	{
		name: 'Localhost 8546',
		networkProvider: 'ws://localhost:8546',
		networkId: 1337,
		// disabled: true
	}
];
