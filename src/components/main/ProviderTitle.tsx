import * as React from 'react';
import { ZapProvider } from '@zapjs/provider';
import { ProviderTitleProfileLink } from './ProviderTitleProfileLink';
import { ProviderTitleExpandArrow } from './ProviderTitleExpandArrow';

export const ProviderTitle = React.memo(({endpointsCount, oracle}: {endpointsCount: number; oracle: ZapProvider}) => {
	return (
		<td>
			<ProviderTitleProfileLink oracle={oracle} />
			<ProviderTitleExpandArrow providerOwner={oracle.providerOwner} endpointsCount={endpointsCount} />
		</td>
	);
});
