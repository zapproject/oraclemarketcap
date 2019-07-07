import * as React from 'react';
import { ProviderTitle } from './ProviderTitle';
import { ProviderEndpoint } from './ProviderEndpoint';
import { ProviderDots } from './ProviderDots';
import { ProviderPrice } from './ProviderPrice';
import { ProviderCurve } from './ProviderCurve';

interface Props {
	oracle: any;
	endpoint: string;
	endpointsCount: number;
	isFirst: boolean;
	isLast: boolean;
}

export const TableRow = React.memo(({oracle, endpoint, endpointsCount, isFirst, isLast}: Props) => (
	<tr>
		<ProviderTitle></ProviderTitle>
		<ProviderEndpoint></ProviderEndpoint>
		<ProviderDots></ProviderDots>
		<ProviderPrice></ProviderPrice>
		<ProviderCurve></ProviderCurve>
	</tr>
));
