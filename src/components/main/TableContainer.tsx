import * as React from 'react';
import { TableRows } from './TableRows';

export const TableContainer = React.memo(({items}: any) => (
	<div className="table-container">
		<div className="table-header-background"></div>
		<table className="provider-table">
			<tbody>
				<tr id="provider-labels">
					<th className="table-title">Oracle Title</th>
					<th className="table-title">Endpoint</th>
					<th className="table-title">Zap Bound</th>
					<th className="table-title">DOTs Bound</th>
					<th className="table-title">Price of DOT</th>
					<th className="table-title">Bonding Curve</th>
					<th className="table-title">Oracle Address</th>
				</tr>
				<TableRows items={items} />
			</tbody>
		</table>
	</div>
));
