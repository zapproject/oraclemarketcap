export interface Action {
	type: string;
	payload: any;
}

export interface AppContext {
	web3: any;
	netId: number;
	handleNetworkChange: (netId: number) => void
}

