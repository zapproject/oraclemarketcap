import * as React from 'react';
import { ZapProvider } from '@zapjs/provider/lib/src';
import { getProviderParam } from '../../utils';

export const ProviderTitleProfileLink = React.memo(({oracle}:{oracle: ZapProvider}) => {

	const [url, setUrl] = React.useState('');

	React.useEffect(() => {
		getProviderParam(oracle, 'profile.md').then(url => {
			if (!url) return;
			setUrl(url);
		}).catch(console.info);
	}, [oracle]);

	return (
		<a href={url}>{oracle.title}</a>
	);
});
