import * as React from 'react';
import { Curve } from '@zapjs/curve';
import {CurveSvgLineChart} from 'zap-curve-chart/lib/CurveSvgLineChart';


export const ProviderCurve = React.memo(({curve, dots}: {curve: Curve, dots: number}) => {
	const el = React.useRef(null);
	React.useEffect(() => {
		if (!curve) return;
		let lineChart: CurveSvgLineChart = null;
		try {
			lineChart = new CurveSvgLineChart(el.current, {width: 180, height: 60, maxDots: 150});
			lineChart.draw(curve.values, Math.min(dots + 1, curve.max));
		} catch (e) {
			console.log(e, curve, dots);
		}
		return () => {
			if (lineChart) lineChart.destroy();
		};
	});
	return (
		(!!curve ? <React.Fragment>
			<article ref={el} />
			<div>
				<div>{JSON.stringify(curve.values)}</div>
				<div>{Curve.curveToString(curve.values)}</div>
			</div>
		</React.Fragment> : <span>&nbsp;</span>)
	);
});
