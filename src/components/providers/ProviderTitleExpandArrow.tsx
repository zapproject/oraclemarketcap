import * as React from 'react';

interface Props {
	providerOwner: string;
	endpointsCount: number;
	url: string;
};

export const ProviderTitleExpandArrow = React.memo(({endpointsCount, providerOwner, url}: Props) => (
	<React.Fragment>
		<a className="fold-icon" data-oracle={providerOwner} href={url}></a>
		<span> ({endpointsCount})</span>
	</React.Fragment>
));
