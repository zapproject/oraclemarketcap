import * as React from 'react';
import { networks } from '../../netowrks';

type Props = {
	netId: number;
	onSelect: (network: any) => void;
}

export const NetworkSelect = React.memo(({netId, onSelect}: Props) => (
	<div className="network-container">
		<label className="network">
			Network
			<select value={netId} onChange={e => onSelect(Number((e.target as any).value))}>
				{networks.map(network => <option key={network.networkId} value={network.networkId}>{network.name}</option>)}
			</select>
		</label>
	</div>
));
