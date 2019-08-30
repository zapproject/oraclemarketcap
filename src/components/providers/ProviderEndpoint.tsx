import * as React from 'react';
import { makeHash } from '../../utils';
import { ZapProvider } from '@zapjs/provider';
import { parseHash } from 'zap-extras/lib/ui/shared/pagination/utils';

interface Props {
	endpoint: string;
	endpointLink: string;
	oracle: ZapProvider;
}

export const ProviderEndpoint = React.memo(({endpoint, oracle, endpointLink}: Props) => {
	const url = endpointLink ? '#' + makeHash({...parseHash(), expandedAddress: oracle.providerOwner + endpoint}) : null;
	return <a href={url}>{endpoint}</a>;
});
