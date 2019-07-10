import * as React from 'react';
import { parseHash, makeHash } from '../../utils';

interface Props {
	providerOwner: string;
	endpointsCount: number;
};

export const ProviderTitleExpandArrow = React.memo(({endpointsCount, providerOwner}: Props) => {
	const url = '#' + makeHash({...parseHash(), expandedAddress: providerOwner});
	return (<React.Fragment>
		<a className="fold-icon" data-oracle={providerOwner} href={url}></a>
		<span> ({endpointsCount})</span>
	</React.Fragment>)
});