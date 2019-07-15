import * as React from 'react';
import { ProviderTitle } from './ProviderTitle';
import { ProviderEndpoint } from './ProviderEndpoint';
import { ProviderPrice } from './ProviderPrice';
import { ProviderCurve } from './ProviderCurve';
import { ProviderAddress } from './ProviderAddress';
import { getProviderParam } from '../../utils';

interface Props {
	oracle: any;
	expanded: boolean;
	endpoint: string;
	endpointsCount: number;
	isFirst: boolean;
	isLast: boolean;
}


export const ProviderRow = ({oracle, endpoint, expanded, endpointsCount, isFirst, isLast}: Props) => {
	const [endpointData, setEndpointData] = React.useState({
		oracle: null,
		endpoint: null,
		dotsIssued: null,
		curve: null,
		zapBound: '',
		profileLink: null,
		endpointLink: null,
	});

	React.useEffect(() => {
		if (endpointData.endpoint === endpoint && endpointData.oracle === oracle) return;
		if (!(isFirst || expanded)) return;
		Promise.all([
			oracle.getDotsIssued(endpoint).then(Number).catch(() => null),
			oracle.getCurve(endpoint).catch(() => null),
			oracle.getZapBound(endpoint).catch(() => ''),
			getProviderParam(oracle, 'profile.md').catch(() => null),
			getProviderParam(oracle, endpoint + '.md').catch(() => null),
		]).then(([dotsIssued, curve, zapBound, profileLink, endpointLink]) => {
			setEndpointData({ endpoint, oracle, dotsIssued, curve, zapBound, profileLink, endpointLink });
		});
	}, [oracle, endpoint, expanded]);

	const className = ['provider-row', oracle.providerOwner];
	className.push(isFirst ? 'first' : 'folded-endpoint');
	if (expanded) className.push('visible');
	if (isLast) className.push('last');
	return <tr className={className.join(' ')}>
		<td>
			{isFirst
				? <ProviderTitle profileLink={endpointData.profileLink} expanded={expanded} oracle={oracle} endpointsCount={endpointsCount} />
				: <span>&nbsp;</span>}
		</td>
		<td>
			<ProviderEndpoint endpointLink={endpointData.endpointLink} endpoint={endpoint} oracle={oracle} />
		</td>
		<td>
			{endpointData.zapBound}
		</td>
		<td>
			{endpointData.dotsIssued}
		</td>
		<td>
			<ProviderPrice dots={endpointData.dotsIssued} curve={endpointData.curve} />
		</td>
		<td className="curve-chart">
			<ProviderCurve dots={endpointData.dotsIssued} curve={endpointData.curve} />
		</td>
		<td>
			<ProviderAddress address={oracle.providerOwner} />
		</td>
	</tr>
};
