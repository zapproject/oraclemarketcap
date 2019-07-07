import * as React from 'react';
import { TableRow } from './TableRow';

interface Props {
	items: any[];
};

export const TableRows = React.memo(({items}: Props) => {
	return <React.Fragment>
		{items.map((item, index) => <TableRow item={item} />)}
	</React.Fragment>
));
