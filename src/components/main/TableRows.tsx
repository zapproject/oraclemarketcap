import * as React from 'react';
import { TableRow } from './TableRow';
import { ZapProvider } from '@zapjs/provider';

interface Props {
	items: Array<{provider: ZapProvider, endpoints: string[]}>;
};

export const TableRows = React.memo(({items}: Props) => {
	const oraclesWithEndpoints = [];
	items.forEach(item => {
		const endpointsCount = item.endpoints.length;
		item.endpoints.forEach((endpoint, index) => {
			oraclesWithEndpoints.push({
				oracle: item.provider,
				endpoint,
				endpointsCount,
				isFirst: index === 0,
				isLast: index === endpointsCount - 1,
			});
		})
	})
	return <React.Fragment>
		{oraclesWithEndpoints.map(params => <TableRow {...params} />)}
	</React.Fragment>
});
