import * as React from 'react';
import { ProviderTitle } from './ProviderTitle';
import { ProviderEndpoint } from './ProviderEndpoint';
import { ProviderDots } from './ProviderDots';
import { ProviderPrice } from './ProviderPrice';
import { ProviderCurve } from './ProviderCurve';
import { ProviderZapBound } from './ProviderZapBound';
import { ProviderAddress } from './ProviderAddress';

interface Props {
	oracle: any;
	endpoint: string;
	endpointsCount: number;
	isFirst: boolean;
	isLast: boolean;
}

export const TableRow = React.memo(({oracle, endpoint, endpointsCount, isFirst, isLast}: Props) => {
	const [providerData, setProviderData] = React.useState(null);
	const className = ['provider-row', oracle.providerOwner];
	className.push(isFirst ? 'first' : 'folded-endpoint');
	if (isLast) className.push('last');
	return <tr className={className.join(' ')}>
		{isFirst ? <ProviderTitle oracle={oracle} endpointsCount={endpointsCount}></ProviderTitle> : <td>&nbsp;</td>}
		<ProviderEndpoint />
		<ProviderZapBound />
		<ProviderDots />
		<ProviderPrice />
		<ProviderCurve />
		<ProviderAddress />
	</tr>
});
