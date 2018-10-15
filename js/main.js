function init() {
	if (typeof window.web3 === 'undefined'){
		alert("PLEASE GET METAMASK");
		return;
	}
	// create the registry object
	const options = {
		networkId: 42,
		networkProvider: web3.currentProvider
	};
	const registry = new zapjs.ZapRegistry(options);
	const dialog = document.getElementById('dialog');
	const oraclesContainer = document.getElementById('provider-labels').parentElement;
	window.addEventListener('hashchange', e => {
		handleLocationChange(registry, dialog, e.oldURL);
	});
	window.addEventListener('load', () => {
		dialogPolyfill.registerDialog(dialog);
		dialog.addEventListener('close', () => { location.hash = '0'; });
	});

	render(registry, new zapjs.ZapBondage(options), oraclesContainer).then(() => {
		handleLocationChange(registry, dialog);
	});
}

function removeHighligth(element) {
	if (!element) return;
	setTimeout(() => { element.classList.remove('highlight'); }, 1500);
}

function addHighlight(element) {
	if (!element) return;
	element.classList.add('highlight');
	if ('scrollIntoView' in element) element.scrollIntoView({
		behavior: 'smooth',
		block: 'center',
		inline: 'center',
	});
}

function handleLocationChange(registry, dialog, oldURL) {
	if (oldURL) removeHighligth(document.getElementById('_' + oldURL.split('#')[1]));
	if (dialog.hasAttribute('open')) dialog.close();
	document.documentElement.classList.remove('dialog-openned');
	if (!/^0x[0-9a-fA-F]{40}.+$/.test(location.hash.slice(1))) {
		return;
	}
	document.documentElement.classList.add('dialog-openned');
	const provider = location.hash.slice(1, 43);
	const endpoint = location.hash.slice(43);
	const container = dialog.lastElementChild;
	container.innerHTML = `<p>Loading info ...<br>Provider: ${provider}<br>Endpoint: ${endpoint}</p>`;
	dialog.showModal();
	getEndpointInfoUrl(provider, endpoint, registry)
		.then(address => Promise.race([
			fetch('https://cloudflare-ipfs.com/ipfs/' + address),
			new Promise((_, reject) => { setTimeout(() => { reject(new Error('Request timeout')); }, 2000); }),
		]))
		.then(response => response.text())
		.then(response => {
			container.innerHTML = marked(response);
		}).catch(error => {
			const p = document.createElement('p');
			p.textContent = error.message;
			container.appendChild(p);
			console.log(error);
		});
	addHighlight(document.getElementById('_' + provider + endpoint));
}

function getAllProvidersWithEndpointsAndTitles(registry) {
	return registry.getAllProviders().then(providers => Promise.all([
		Promise.all(providers.map(provider => registry.getProviderTitle(provider))),
		Promise.all(providers.map(provider => registry.getProviderEndpoints(provider).then(endpoints => ({provider, endpoints})))),
	])).then(([providerTitles, endpointsByProvider]) =>
		endpointsByProvider.reduce((allEndpoints, {provider, endpoints}, providerIndex) =>
			allEndpoints.concat(endpoints.map(endpoint => ({
				endpoint: endpoint,
				provider: provider,
				title: providerTitles[providerIndex],
			}))), [])
	).catch(console.error);
}

function getEndpointInfoUrl(address, endpoint, registry) {
	return registry.contract.methods.getEndPointParams(address, registry.provider.utils.utf8ToHex(endpoint)).call().then(params => {
		if (!params.length) throw new Error('No endpoint IPFS url param ');
		const address = ipfsUtils.hexToAddress(params[0].replace('0x', ''));
		if (!ipfsUtils.isIpfsAddress(address)) throw new Error('Endpoint first param is not a valid IPFS hash');
		return address;
	});
}

function render(registry, bondage, container) {
	return getAllProvidersWithEndpointsAndTitles(registry).then(oracles => {
		oracles.forEach(oracle => {
			container.appendChild(renderOracle(oracle, registry, bondage));
		});
	}).catch(console.error);
}

function renderOracle(oracle, registry, bondage) {
	const tr = document.createElement('tr');
	tr.id = '_' + oracle.provider + oracle.endpoint;
	tr.className = 'provider-listing';
	tr.appendChild(renderTitle(oracle));
	tr.appendChild(renderEndpoint(oracle, registry));
	tr.appendChild(renderZap(oracle, bondage));

	const dotsTd = tr.appendChild(document.createElement('td'));
	const priceTd = tr.appendChild(document.createElement('td'));
	const curveTd = tr.appendChild(document.createElement('td'));

	const dotsPromise = renderDots(oracle, bondage, dotsTd);
	const curvePromise = renderCurve(oracle, registry, curveTd, dotsPromise); // depends on dots
	renderPrice(priceTd, dotsPromise, curvePromise); // depends on dots and curve

	tr.appendChild(renderAddress(oracle));
	return tr;
}

function oracleLink(oracle) {
	const a = document.createElement('a');
	a.textContent = oracle.title;
	// a.setAttribute('href', '#' + oracle.provider + oracle.endpoint);
	return a;
}

function renderTitle(oracle) {
	const td = document.createElement('td');
	td.appendChild(oracleLink(oracle));
	return td;
}

function endpointLink(oracle, registry) {
	const a = document.createElement('a');
	a.textContent = oracle.endpoint;
	getEndpointInfoUrl(oracle.provider, oracle.endpoint, registry).then(() => {
		a.setAttribute('href', '#' + oracle.provider + oracle.endpoint);
	});
	return a;
}

function renderEndpoint(oracle, registry) {
	const td = document.createElement('td');
	td.appendChild(endpointLink(oracle, registry));
	return td;
}

function renderZap(oracle, bondage) {
	const td = document.createElement('td');
	bondage.getZapBound(oracle).then(zap => { td.textContent = zap; });;
	return td;
}

function renderDots(oracle, bondage, td) {
	const promise = bondage.getDotsIssued(oracle).then(Number);
	promise.then(dots => { td.textContent = dots; });
	return promise;
}

function renderPrice(td, dotsPromise, curvePromise) {
	return Promise.all([dotsPromise, curvePromise])
		.then(([dots, curve]) => {
			td.textContent = curve.getPrice(Math.min(dots + 1, curve.max));
		}).catch(console.error);
}

function renderCurve(oracle, registry, td, dotsPromise) {
	td.className = 'curve-chart';
	return Promise.all([dotsPromise, registry.getProviderCurve(oracle.provider, oracle.endpoint)])
		.then(([dots, curve]) => {
			const lineChart = new ZapCurve.CurveLineChart(td);
			lineChart.draw(curve.values, Math.min(dots + 1, curve.max));
			const div = document.createElement('div');
			div.textContent = curveToString(curve);
			td.appendChild(div);
			return curve;
		}).catch(console.error);
}

function renderAddress(oracle) {
	const td = document.createElement('td');
	td.textContent = oracle.provider;
	return td;
}


// converts a curve into a string
function curveToString(curve){
	const values = curve.values;
	const length = values[0];
	var str = "";

	for(var i = length; i > 0; i--){ // convert each term into string
		let coeff = values[i];
		let pow = i-1;

		if(coeff == 0) continue;
		if(i != length) str += " + ";
		str += coeff;
		if(pow != 0){
			str += "x^" + pow;
		}
	}
	return str;
}

init();