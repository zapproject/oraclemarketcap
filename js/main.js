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
		prevRenderedOracles.forEach(row => { oraclesContainer.removeChild(row.tr); }); // clear old oracles when network is changed
		render(registry, bondage, oraclesContainer).then(renderedOracles => {
			prevRenderedOracles = renderedOracles;
			initFoldingOracles(prevRenderedOracles);
			handleLocationChange(registry, dialog, null, prevRenderedOracles);
			initFilter(prevRenderedOracles, document.getElementById('search-term'));
		}).catch(console.log);
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

	let prevUnfoldedOracle = null;
	oraclesContainer.addEventListener('click', e => {
		const oracle = e.target.getAttribute('data-oracle');
		if (!oracle) return;
		if (e.target.className === 'copy-icon') {
			handleCopy(e.target, oracle);
			return;
		}
		if (e.target.className !== 'fold-icon') return;
		if (prevUnfoldedOracle) {
			foldOracles(prevUnfoldedOracle, prevRenderedOracles);
		}
		if (prevUnfoldedOracle !== oracle) {
			unfoldOracles(oracle, prevRenderedOracles);
			prevUnfoldedOracle = oracle;
		} else {
			prevUnfoldedOracle = null;
		}
	});
}

function handleCopy(target, oracle) {
	const text = target.appendChild(document.createElement('textarea'));
	text.value = oracle;
	text.focus();
	text.select();
	document.execCommand('copy');
	target.removeChild(text);
	target.classList.add('copied');
	setTimeout(() => {target.classList.remove('copied')}, 500);
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
	input.addEventListener('input', () => {
		if (timeout) clearTimeout(timeout);
		timeout = setTimeout(() => {
			const search = input.value.toLowerCase();
			if (input.value.length === 0) {
				renderedOracles.forEach(({tr}) => {tr.removeAttribute('hidden')});
				initFoldingOracles(renderedOracles);
				return;
			}
			if (input.value.length < 3) return;
			renderedOracles.forEach(row => {
				const oracle = row.oracle;
				const tr = row.tr;
				if (
					oracle.provider.toLowerCase().indexOf(search) !== -1 ||
					oracle.endpoint.toLowerCase().indexOf(search) !== -1 ||
					oracle.title.toLowerCase().indexOf(search) !== -1
				) {
					tr.removeAttribute('hidden');
				} else {
					tr.setAttribute('hidden', true);
				}
			});
			initFoldingOracles(renderedOracles);
		}, 300);
	})
}

function handleLocationChange(registry, dialog, oldURL, renderedOracles) {
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
	if (renderedOracles) unfoldOracles(provider, renderedOracles);
	let infoRequst;
	switch(target) {
		case 'endpoint':
			infoRequst = getLinkFromProviderParam(provider, endpoint + '.md', registry);
			container.innerHTML = `<p>Loading info ...<br>Provider: ${provider}<br>Endpoint: ${endpoint}</p>`;
			break;
		case 'provider':
			infoRequst = getLinkFromProviderParam(provider, 'profile.md', registry);
			container.innerHTML = `<p>Loading info ...<br>Provider: ${provider}</p>`;
			break;
		default:
			return;
	}
	dialog.showModal();
	infoRequst
		.then(url => Promise.race([
			fetch(url),
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

function paramToUrl(hexToUtf8, hex) {
	if (!hex) throw new Error('Provider parameter is not set.');
	let url;
	try {
		url = hexToUtf8(hex);
	} catch (e) {
		url = ipfsUtils.hexToAddress(hex);
	}
	if (ipfsUtils.isIpfsAddress(url)) return 'https://cloudflare-ipfs.com/ipfs/' + url;
	if (/^https?:\/\//gmi.test(url)) return url;
	throw new Error('Provider parameter is not a valid url.');
}

function getLinkFromProviderParam(address, param, registry) {
	return new Promise((resolve, reject) => {
		registry.contract.methods.getProviderParameter(address, registry.provider.utils.utf8ToHex(param)).call()
			.then(parameter => {
				resolve(paramToUrl(registry.provider.utils.hexToUtf8, parameter));
			})
			.catch(() => {
				// reject(new Error('param does not exist'));
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
	tr.className = 'provider-row ' + oracle.provider;
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
	const arrow = document.createElement('a');
	arrow.className = 'fold-icon';
	arrow.setAttribute('data-oracle', oracle.provider);
	const a = document.createElement('a');
	a.textContent = oracle.title;
	getLinkFromProviderParam(oracle.provider, 'profile.md', registry).then(() => {
		a.setAttribute('href', '#provider' + oracle.provider + oracle.endpoint);
	});
	a.appendChild(document.createElement('span'));
	td.appendChild(arrow);
	td.appendChild(a);
	return td;
}

function renderEndpoint(oracle, registry) {
	const td = document.createElement('td');
	const a = document.createElement('a');
	a.textContent = oracle.endpoint;
	getLinkFromProviderParam(oracle.provider, oracle.endpoint + '.md', registry).then(() => {
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
	const icon = document.createElement('a');
	icon.title = oracle.provider;
	icon.className = 'copy-icon';
	icon.setAttribute('data-oracle', oracle.provider);
	td.appendChild(icon);
	return td;
}

function initFoldingOracles(renderedOracles) {
	renderedOracles.forEach(row => {
		row.tr.className = 'provider-row ' + row.oracle.provider;
	});
	const visibleOracles = renderedOracles.filter(row => !row.tr.hasAttribute('hidden'));
	let firstIndex = 0;
	for (let i = 0, len = visibleOracles.length; i < len; i++) {
		const {tr, oracle} = visibleOracles[i];
		const nextRow = visibleOracles[i + 1];
		const prevRow = visibleOracles[i - 1];
		if (
			(nextRow && nextRow.oracle.provider === oracle.provider) &&
			(!prevRow || prevRow.oracle.provider !== oracle.provider)
		) {
			firstIndex = i;
			tr.classList.add('first');
		}
		if (
			(!nextRow || nextRow.oracle.provider !== oracle.provider) &&
			(prevRow && prevRow.oracle.provider === oracle.provider)
		) {
			tr.classList.add('last');
			visibleOracles[firstIndex].tr.firstChild.lastChild.lastChild.textContent = ' (' + (i - firstIndex + 1) + ')';
		}
		if (prevRow && prevRow.oracle.provider === oracle.provider) {
			tr.classList.add('folded-endpoint');
		}
	}
}

function foldOracles(provider, renderedOracles) {
	const oracles = renderedOracles.filter(row => !row.tr.hasAttribute('hidden') && row.oracle.provider === provider);
	oracles[0].tr.classList.remove('visible');
	for (let i = 1, len = oracles.length; i < len; i++) {
		oracles[i].tr.classList.remove('visible');
	}
}

function unfoldOracles(provider, renderedOracles) {
	const oracles = renderedOracles.filter(row => !row.tr.hasAttribute('hidden') && row.oracle.provider === provider);
	oracles[0].tr.classList.add('visible');
	for (let i = 1, len = oracles.length; i < len; i++) {
		oracles[i].tr.classList.add('visible');
	}
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

function loadCSS(href) {
	const css = document.createElement('link');
	css.rel = 'stylesheet';
	css.href = href;
	document.getElementsByTagName('head')[0].appendChild(css);
}

init();
loadCSS('https://cdnjs.cloudflare.com/ajax/libs/dialog-polyfill/0.4.10/dialog-polyfill.min.css');
loadCSS('https://cdnjs.cloudflare.com/ajax/libs/font-awesome/4.7.0/css/font-awesome.min.css');
loadCSS('https://cdnjs.cloudflare.com/ajax/libs/github-markdown-css/2.10.0/github-markdown.min.css');
loadCSS('https://fonts.googleapis.com/css?family=Open+Sans:400,600,800');