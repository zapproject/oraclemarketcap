import * as React from 'react';
import { ZapProvider } from '@zapjs/provider';
import { ProviderTitleExpandArrow } from './ProviderTitleExpandArrow';
import { makeHash, parseHash } from '../../utils';

interface Props {
	endpointsCount: number;
	profileLink: string;
	oracle: ZapProvider;
	expanded: boolean;
}

export const ProviderTitle = React.memo(({endpointsCount, oracle, expanded, profileLink}: Props) => {
	const url = '#' + makeHash({...parseHash(), expandedAddress: expanded ? '' : oracle.providerOwner});
	return (
		<React.Fragment>
			<a href={profileLink ? (expanded ? url : url + 'profile') : null}>{oracle.title}</a>
			{endpointsCount > 1 && <ProviderTitleExpandArrow providerOwner={oracle.providerOwner} url={url} endpointsCount={endpointsCount} />}
		</React.Fragment>
	);
});
