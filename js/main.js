function init() {
	const networks = [
		{
			name: 'Kovan',
			networkProvider: 'wss://kovan.infura.io/ws',
			networkId: 42
		},
		{
			name: 'Mainnet',
			networkProvider: 'wss://mainnet.infura.io/ws',
			networkId: 1,
			disabled: true
		},
		{
			name: 'Localhost 8546',
			networkProvider: 'ws://localhost:8546',
			networkId: 1337,
			disabled: true
		}
	];
	let registry;
	let bondage;
	let prevRenderedOracles = [];
	const oraclesContainer = document.getElementById('provider-labels').parentElement;
	const handleNetworkChange = (network) => {
		registry = new zapjs.ZapRegistry(network);
		bondage = new zapjs.ZapBondage(network);
		prevRenderedOracles.forEach(({tr}) => { oraclesContainer.removeChild(tr); }); // clear old oracles when network is changed
		render(registry, bondage, oraclesContainer).then(renderedOracles => {
			prevRenderedOracles = renderedOracles;
			handleLocationChange(registry, dialog);
			initFilter(renderedOracles, document.getElementById('search-term'));
		});
	}
	renderNetworkOptionsSelect(document.getElementById('network-select'), networks, handleNetworkChange);
	handleNetworkChange(networks[0]); // start with Kovan
	const dialog = document.getElementById('dialog');
	window.addEventListener('hashchange', e => {
		handleLocationChange(registry, dialog, e.oldURL);
	});
	window.addEventListener('load', () => {
		dialogPolyfill.registerDialog(dialog);
		dialog.addEventListener('close', () => { location.hash = '0'; });
	});
}

function renderNetworkOptionsSelect(select, networks, onChange) {
	networks.forEach(network => {
		const option = document.createElement('option');
		option.value = network.networkId;
		option.textContent = network.name;
		if (network.disabled) option.disabled = true;
		select.appendChild(option);
	});
	select.addEventListener('change', () => {
		const value = Number(select.value);
		if (!value || isNaN(value)) return;
		let i = networks.length;
		while (i--) {
			if (networks[i].networkId !== value) continue;
			onChange(networks[i]);
			break;
		}
	});
}

function initFilter(renderedOracles, input) {
	let timeout;
	const showElement = el => { if (el.hasAttribute('hidden')) el.removeAttribute('hidden') };
	const hideElement = el => { if (!el.hasAttribute('hidden')) el.setAttribute('hidden', true) }
	input.addEventListener('input', () => {
		if (timeout) clearTimeout(timeout);
		timeout = setTimeout(() => {
			const search = input.value.toLowerCase();
			if (input.value.length === 0) {
				renderedOracles.forEach(({tr}) => showElement(tr));
				return;
			}
			if (input.value.length < 3) return;
			renderedOracles.forEach(({oracle, tr}) => {
				if (
					oracle.provider.toLowerCase().indexOf(search) !== -1 ||
					oracle.endpoint.toLowerCase().indexOf(search) !== -1 ||
					oracle.title.toLowerCase().indexOf(search) !== -1
				) {
					showElement(tr);
				} else {
					hideElement(tr);
				}
			});
		}, 300);
	})
}

function handleLocationChange(registry, dialog, oldURL) {
	if (oldURL) {
		let element = document.getElementById('_' + (oldURL.split('#')[1] || '').slice(8));
		if (element) setTimeout(() => { element.classList.remove('highlight'); }, 1500);
	}
	if (dialog.hasAttribute('open')) dialog.close();
	document.documentElement.classList.remove('dialog-openned');
	const hash = location.hash.trim();
	if (!/^(provider|endpoint)0x[0-9a-fA-F]{40}.*$/.test(hash.slice(1))) {
		return;
	}
	document.documentElement.classList.add('dialog-openned');
	const provider = hash.slice(9, 51);
	const endpoint = hash.slice(51);
	const target = endpoint ? hash.slice(1, 9) : 'provider';
	const container = dialog.lastElementChild;
	let infoRequst;
	switch(target) {
		case 'endpoint':
			infoRequst = getEndpointInfoUrl(provider, endpoint, registry);
			container.innerHTML = `<p>Loading info ...<br>Provider: ${provider}<br>Endpoint: ${endpoint}</p>`;
			break;
		case 'provider':
			infoRequst = getProviderInfoUrl(provider, registry);
			container.innerHTML = `<p>Loading info ...<br>Provider: ${provider}</p>`;
			break;
		default:
			return;
	}
	dialog.showModal();
	infoRequst
		.then(address => Promise.race([
			fetch('https://cloudflare-ipfs.com/ipfs/' + address),
			new Promise((_, reject) => { setTimeout(() => { reject(new Error('Request timeout.')); }, 2000); }),
		]))
		.then(response => response.text())
		.then(response => {
			container.innerHTML = marked(response);
		}).catch(error => {
			const p = document.createElement('p');
			p.textContent = error.message;
			container.appendChild(p);
		});
	let element = document.getElementById('_' + provider + endpoint) || document.getElementsByClassName(provider)[0];
	if (!element) return;
	element.classList.add('highlight');
	if ('scrollIntoView' in element) element.scrollIntoView({
		behavior: 'smooth',
		block: 'center',
		inline: 'center',
	});
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
		if (!ipfsUtils.isIpfsAddress(address)) throw new Error('Endpoint first param is not a valid IPFS hash.');
		return address;
	});
}

function getProviderInfoUrl(address, registry) {
	const request = registry.contract.methods.getProviderParameter(address, registry.provider.utils.utf8ToHex('profile')).call();
	return new Promise((resolve, reject) => {
		request.then(parameter => {
			if (!parameter) reject(new Error('No provider IPFS url parameter.'));
			const address = ipfsUtils.hexToAddress(parameter.replace('0x', ''));
			if (!ipfsUtils.isIpfsAddress(address)) reject(new Error('Provider `profile` parameter is not a valid IPFS hash.'));
			resolve(address);
		}).catch(() => {
			reject(new Error('Error occured. Perhaps provider parameter `profile` is not set.'));
		});
	});
}

function render(registry, bondage, container) {
	return getAllProvidersWithEndpointsAndTitles(registry).then(oracles => oracles.map(oracle => {
		const tr = container.appendChild(renderOracle(oracle, registry, bondage));
		return {tr, oracle}
	})).catch(console.error);
}

function renderOracle(oracle, registry, bondage) {
	const tr = document.createElement('tr');
	tr.className = 'provider-listing ' + oracle.provider;
	tr.id = '_' + oracle.provider + oracle.endpoint;

	tr.appendChild(renderTitle(oracle, registry));
	tr.appendChild(renderEndpoint(oracle, registry));
	tr.appendChild(renderZap(oracle, bondage));

	const dotsTd = tr.appendChild(document.createElement('td'));
	const priceTd = tr.appendChild(document.createElement('td'));
	const curveTd = tr.appendChild(document.createElement('td'));
	const dotsPromise = renderDots(oracle, bondage, dotsTd);
	const curvePromise = renderCurve(oracle, registry, curveTd, dotsPromise);
	renderPrice(priceTd, dotsPromise, curvePromise);

	tr.appendChild(renderAddress(oracle));
	return tr;
}

function renderTitle(oracle, registry) {
	const td = document.createElement('td');
	const a = document.createElement('a');
	a.textContent = oracle.title;
	getProviderInfoUrl(oracle.provider, registry).then(() => {
		a.setAttribute('href', '#provider' + oracle.provider + oracle.endpoint);
	});
	td.appendChild(a);
	return td;
}

function renderEndpoint(oracle, registry) {
	const td = document.createElement('td');
	const a = document.createElement('a');
	a.textContent = oracle.endpoint;
	getEndpointInfoUrl(oracle.provider, oracle.endpoint, registry).then(() => {
		a.setAttribute('href', '#endpoint' + oracle.provider + oracle.endpoint);
	});
	td.appendChild(a);
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
			const lineChart = new ZapCurve.CurveLineChart(td, {width: 180, height: 60});
			lineChart.draw(curve.values, Math.min(dots + 1, curve.max));
			const div = document.createElement('div');
			const div1 = document.createElement('div');
			const div2 = document.createElement('div');
			div1.textContent = JSON.stringify(curve.values);
			div2.textContent = curveToString(curve);
			div.appendChild(div1);
			div.appendChild(div2);
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