import * as React from 'react';

export const Search = React.memo(({ search }: {search: string}) => (
	<div className="search-container">
		<div className="search">
			<input type="text" id="search-term" placeholder="Search" />
			<img src="/assets/img/search-icon.svg" />
		</div>
	</div>
));
