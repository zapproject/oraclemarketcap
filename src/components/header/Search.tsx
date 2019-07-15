import * as React from 'react';
import { navigate } from '../../utils';

let timeout;
function handleSearch(e) {
	const input = e.target;
	if (timeout) clearTimeout(timeout);
	timeout = setTimeout(() => {
		const search = input.value.toLowerCase().trim();
		if (search.length === 0) {
			navigate({search, page: 1})
			return;
		}
		if (search.length < 3) return;
		navigate({search, page: 1})
	}, 300);
}

export const Search = React.memo(({ search }: {search: string}) => (
	<div className="search-container">
		<div className="search">
			<input onInput={handleSearch} type="text" id="search-term" defaultValue={search} placeholder="Search" />
			<img src="/assets/img/search-icon.svg" />
		</div>
	</div>
));
