import * as React from 'react';
import { Curve } from '@zapjs/curve';

export const ProviderPrice = React.memo(({curve, dots}: {curve: Curve, dots: number}) => {
	if (!curve || dots === null) return <React.Fragment>&nbsp;</React.Fragment>;
	const issuedDots = dots ? Math.min(dots + 1, curve.max) : 1;
	const price = curve.getPrice(issuedDots);
	return <React.Fragment>{price}</React.Fragment>
});
