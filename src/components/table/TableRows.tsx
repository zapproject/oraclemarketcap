import * as React from 'react';
import { ZapProvider } from '@zapjs/provider';
import { ProviderRow } from '../providers/ProviderRow';

interface Props {
	items: Array<{provider: ZapProvider, endpoints: string[]}>;
	expanded: string;
};

export const TableRows = React.memo(({items, expanded}: Props) => {
	const oraclesWithEndpoints = [];
	items.forEach(item => {
		const endpointsCount = item.endpoints.length;
		item.endpoints.forEach((endpoint, index) => {
			oraclesWithEndpoints.push({
				oracle: item.provider,
				expanded: expanded === item.provider.providerOwner,
				endpoint,
				endpointsCount,
				isFirst: index === 0,
				isLast: index === endpointsCount - 1,
			});
		})
	})
	return <React.Fragment>
		{oraclesWithEndpoints.map(params => <ProviderRow key={params.endpoint + params.oracle.providerOwner} {...params} />)}
	</React.Fragment>
});
