function init(){
	if (typeof window.web3 === 'undefined'){
		alert("PLEASE GET METAMASK");
		return;
	}
	// create the registry object
	const options = {
		networkId: 42,
		networkProvider: web3.currentProvider
	};

	const dialog = document.getElementById('dialog');
	window.addEventListener('hashchange', () => {
		handleLocationChange(dialog);
	});
	window.addEventListener('load', () => {
		dialogPolyfill.registerDialog(dialog);
		const handleDialogClose = () => { location.hash = '0'; }
		dialog.addEventListener('close', handleDialogClose);
		dialog.addEventListener('cancel', handleDialogClose);
		handleLocationChange(dialog);
	});

	render(new zapjs.ZapRegistry(options), new zapjs.ZapBondage(options), document.getElementById('provider-labels').parentElement);
}

function handleLocationChange(dialog) {
	if (!/^#0x[0-9a-fA-F]{40}.+$/.test(location.hash)) {
		if (dialog.hasAttribute('open')) dialog.close();
		document.documentElement.classList.remove('dialog-openned');
		return;
	}
	const provider = location.hash.slice(1, 43);
	const endpoint = location.hash.slice(43);
	document.documentElement.classList.add('dialog-openned');
	dialog.showModal();
	const container = dialog.lastElementChild;
	container.innerHTML = `<p>Loading info ...<br>Provider: ${provider}<br>Endpoint: ${endpoint}</p>`;
	fetch('https://raw.githubusercontent.com/zapproject/zap-monorepo/master/README.md')
		.then(response => response.text())
		.then(response => {
			container.innerHTML = marked(response);
		}).catch(console.error);
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

function render(registry, bondage, container) {
	getAllProvidersWithEndpointsAndTitles(registry).then(oracles => {
		oracles.forEach(oracle => {
			container.appendChild(renderOracle(oracle, registry, bondage));
		});
	}).catch(console.error);
}

function renderOracle(oracle, registry, bondage) {
	const tr = document.createElement('tr');
	tr.className = 'provider-listing';
	tr.appendChild(renderTitle(oracle));
	tr.appendChild(renderEndpoint(oracle));
	tr.appendChild(renderZap(oracle, bondage));
	tr.appendChild(renderDots(oracle, bondage));
	tr.appendChild(renderPrice(oracle, bondage));
	tr.appendChild(renderCurve(oracle, registry));
	tr.appendChild(renderAddress(oracle));
	return tr;
}

function oracleLink(oracle) {
	const a = document.createElement('a');
	a.setAttribute('href', '#' + oracle.provider + oracle.endpoint);
	return a;
}

function renderTitle(oracle) {
	const td = document.createElement('td');
	const a = oracleLink(oracle);
	a.textContent = oracle.title;
	td.appendChild(a);
	return td;
}

function renderEndpoint(oracle) {
	const td = document.createElement('td');
	const a = oracleLink(oracle);
	a.textContent = oracle.endpoint;
	td.appendChild(a);
	return td;
}

function renderZap(oracle, bondage) {
	const td = document.createElement('td');
	bondage.getZapBound(oracle).then(zap => { td.textContent = zap; });;
	return td;
}

function renderDots(oracle, bondage) {
	const td = document.createElement('td');
	bondage.getDotsIssued(oracle).then(dots => { td.textContent = dots; });
	return td;
}

function renderPrice(oracle, bondage) {
	const td = document.createElement('td');
	bondage.calcZapForDots({
		provider: oracle.provider,
		endpoint: oracle.endpoint,
		dots: 1
	}).then(nextPrice => { td.textContent = nextPrice; });
	return td;
}

function renderCurve(oracle, registry) {
	const td = document.createElement('td');
	registry.getProviderCurve(oracle.provider, oracle.endpoint).then(curve => {
		td.textContent = curveToString(curve);
	});
	return td;
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