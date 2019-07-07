import * as React from 'react';

export const Table = React.memo(() => (
	<div className="table-container">
		<div className="table-header-background"></div>
		<table className="provider-table">
			<tr id="provider-labels">
				<th className="table-title">Oracle Title</th>
				<th className="table-title">Endpoint</th>
				<th className="table-title">Zap Bound</th>
				<th className="table-title">DOTs Bound</th>
				<th className="table-title">Price of DOT</th>
				<th className="table-title">Bonding Curve</th>
				<th className="table-title">Oracle Address</th>
			</tr>
		</table>
	</div>
));
