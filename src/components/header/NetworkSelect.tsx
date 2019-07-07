import * as React from 'react';
import { networks } from '../../netowrks';

type Props = {
	networkProvider: string;
	onSelect: (network: any) => void;
}

export const NetworkSelect = React.memo(({networkProvider, onSelect}: Props) => (
	<div className="network-container">
		<label className="network">
			Network
			<select value={networkProvider} onChange={e => onSelect((e.target as any).value)}>
				{networks.map(network => <option key={network.networkId} value={network.networkId}>{network.name}</option>)}
			</select>
		</label>
	</div>
));
