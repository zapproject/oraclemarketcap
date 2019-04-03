function handleCopy(e) {
	const target = e.target;
	const oracle = target.getAttribute('data-oracle');
	const text = target.appendChild(document.createElement('textarea'));
	text.value = oracle;
	text.focus();
	text.select();
	document.execCommand('copy');
	target.removeChild(text);
	target.classList.add('copied');
	setTimeout(() => target.classList.remove('copied'), 500);
}

function initSelect(select, networks, onChange) {
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

function initFilter(input, onSearch, defaultValue) {
	let timeout;
	input.value = defaultValue || '';
	input.addEventListener('input', () => {
		if (timeout) clearTimeout(timeout);
		timeout = setTimeout(() => {
			const search = input.value.toLowerCase().trim();
			if (search.length === 0) {
				onSearch(search);
				return;
			}
			if (search.length < 3) return;
			onSearch(search);
		}, 300);
	});
}

function getAllProvidersWithEndpointsAndTitles(registry) {
	console.info('Endpoints are filtered by default. To change default filter, set sessionStorage `default-endpoint-filter-text` item. Use empty string to show all endpoints');
	let filterText = sessionStorage.getItem('default-endpoint-filter-text');
	if (filterText === null) filterText = 'zap';
	return registry.getAllProviders().then(providers => Promise.all([
		Promise.all(providers.map(provider => registry.getProviderTitle(provider))),
		Promise.all(providers.map(provider => registry.getProviderEndpoints(provider).then(endpoints => ({provider, endpoints})))),
	])).then(([providerTitles, endpointsByProvider]) =>
		endpointsByProvider.reduce((allEndpoints, {provider, endpoints}, providerIndex) =>
			allEndpoints.concat(endpoints.filter(endpoint => !filterText || endpoint.indexOf(filterText) !== -1).map(endpoint => ({
				endpoint: endpoint,
				provider: provider,
				title: providerTitles[providerIndex],
			}))), [])
	).catch(console.error);
}

function getProviderParam(provider, key) {
	return provider.zapRegistry.contract.methods.getProviderParameter(provider.providerOwner, provider.zapRegistry.provider.utils.utf8ToHex(key)).call().then(hex => {
		if (hex.indexOf('0x') !== 0) return hex;
		try {
			return provider.zapRegistry.provider.utils.hexToUtf8(hex);
		} catch (e) {
			console.log(e);
		}
		try {
			const address = hexToAddress(hex.replace('0x', ''));
			if (ipfsUtils.isIpfsAddress(address)) return address;
		} catch (e) {
			console.log(e);
		}
		return hex;
	}).catch(e => {
		return '';
	});
}

function getUrlText(url) {
	return Promise.race([
		fetch(ipfsUtils.isIpfsAddress(url) ? 'https://cloudflare-ipfs.com/ipfs/' + url : url),
		new Promise((_, reject) => { setTimeout(() => { reject(new Error('Request timeout.')); }, 2000); }),
	]).then((response) => response.text());
}

function render(container, providersWithEndpoints) {
	const rows = [];
	let len = 0;
	providersWithEndpoints.forEach(providerWithEndpoints => {
		len = providerWithEndpoints.endpoints.length;
		if (!len) {
			providerWithEndpoints.endpoints.push(null);
			len = 1;
		}
		providerWithEndpoints.endpoints.forEach((endpoint, endpointIndex) => {
			const tr = container.appendChild(renderOracle(
				providerWithEndpoints.provider,
				endpoint,
				len,
				endpointIndex === 0,
				endpointIndex === len - 1
			));
			rows.push({tr, oracle: providerWithEndpoints});
		});
	});
	return rows;
}

function renderEmpty(el = 'div') {
	const div = document.createElement(el);
	div.innerHTML = '&nbsp;';
	return div;
}

function renderOracle(oracle, endpoint, endpointsCount, isFirst, isLast) {
	const tr = document.createElement('tr');
	const className = ['provider-row', oracle.providerOwner];
	className.push(isFirst ? 'first' : 'folded-endpoint');
	if (isLast) className.push('last');
	tr.className = className.join(' ');
	tr.id = '_' + oracle.providerOwner + endpoint;
	tr.appendChild(isFirst ? renderTitle(oracle, endpointsCount) : renderEmpty('td'));
	tr.appendChild(endpoint ? renderEndpoint(oracle, endpoint) : renderEmpty('td'));
	tr.appendChild(endpoint ? renderZap(oracle, endpoint) : renderEmpty('td'));

	const dotsTd = tr.appendChild(document.createElement('td'));
	const priceTd = tr.appendChild(document.createElement('td'));
	const curveTd = tr.appendChild(document.createElement('td'));
	if (endpoint) {
		const dotsPromise = renderDots(oracle, endpoint, dotsTd);
		const curvePromise = renderCurve(oracle, endpoint, curveTd, dotsPromise);
		renderPrice(priceTd, dotsPromise, curvePromise);
	} else {
		dotsTd.appendChild(renderEmpty());
		priceTd.appendChild(renderEmpty());
		curveTd.appendChild(renderEmpty());
	}

	tr.appendChild(renderAddress(oracle));
	return tr;
}

function renderTitle(oracle, endpointsCount) {
	const td = document.createElement('td');
	const a = document.createElement('a');
	a.textContent = oracle.title;
	const url = '#' + makeHash({...parseHash(), expandedAddress: oracle.providerOwner});
	getProviderParam(oracle, 'profile.md').then(url => {
		if (!url) return;
		a.href = url;
	});
	if (endpointsCount > 1) {
		const arrow = document.createElement('a');
		arrow.className = 'fold-icon';
		arrow.setAttribute('data-oracle', oracle.providerOwner);
		arrow.href = url;
		td.appendChild(arrow);
		const span = a.appendChild(document.createElement('span'));
		span.textContent = ' (' + endpointsCount + ')';
	}
	td.appendChild(a);
	return td;
}

function renderEndpoint(oracle, endpoint) {
	const td = document.createElement('td');
	const a = document.createElement('a');
	a.textContent = endpoint;
	getProviderParam(oracle, endpoint + '.md').then(url => {
		if (!url) return;
		a.href = '#' + makeHash({...parseHash(), expandedAddress: oracle.providerOwner + endpoint});
	});
	td.appendChild(a);
	return td;
}

function renderZap(oracle, endpoint) {
	const td = document.createElement('td');
	oracle.getZapBound(endpoint).then(zap => { td.textContent = zap; });
	return td;
}

function renderDots(oracle, endpoint, td) {
	const promise = oracle.getDotsIssued(endpoint).then(Number);
	promise.then(dots => { td.textContent = dots; });
	return promise;
}

function renderPrice(td, dotsPromise, curvePromise) {
	return Promise.all([dotsPromise, curvePromise]).then(([dots, curve]) => {
		if (!curve) return;
		td.textContent = curve.getPrice(Math.min(dots + 1, curve.max));
	}).catch(console.error);
}

function renderCurve(oracle, endpoint, td, dotsPromise) {
	td.className = 'curve-chart';
	return Promise.all([dotsPromise, oracle.getCurve(endpoint)]).then(([dots, curve]) => {
		try {
			const lineChart = new ZapCurveChart.CurveLineChart(td, {width: 180, height: 60, maxDots: 150});
			lineChart.draw(curve.values, Math.min(dots + 1, curve.max));
		} catch (e) {
			console.log(e, oracle, curve, dots);
		}
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
	icon.title = oracle.providerOwner;
	icon.className = 'copy-icon';
	icon.setAttribute('data-oracle', oracle.providerOwner);
	td.appendChild(icon);
	return td;
}

function foldOracles(provider, renderedOracles) {
	const oracles = renderedOracles.filter(row => row.oracle.provider.providerOwner === provider);
	for (let i = 0, len = oracles.length; i < len; i++) {
		oracles[i].tr.classList.remove('visible');
	}
}

function unfoldOracles(provider, renderedOracles) {
	const oracles = renderedOracles.filter(row => row.oracle.provider.providerOwner === provider);
	for (let i = 0, len = oracles.length; i < len; i++) {
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

function getPages(currentPage, totalPages) {
	const delta = 2;
	const left = currentPage - delta;
	const right = currentPage + delta + 1;
	const range = [];
	const rangeWithDots = [];
	let l;
	for (let i = 1; i <= totalPages; i++) {
		if ((i === 1 || i === totalPages) || (i >= left && i < right)) {
			range.push(i);
		}
	}
	for (let i of range) {
		if (l) {
			if (i - l === 2) {
				rangeWithDots.push(l + 1);
			} else if (i - l !== 1) {
				rangeWithDots.push('...');
			}
		}
		rangeWithDots.push(i);
		l = i;
	}
	return rangeWithDots;
}

function getTotalPages(totalItemsLength, pageSize) {
	return Math.ceil(totalItemsLength / pageSize);
}

function getPageStart(page, pageSize) {
	return pageSize * (page - 1);
}

function getPageForItem(item, allItems, pageSize) {
	const index = allItems.indexOf(item);
	return Math.floor(index / pageSize) + 1;
}

function parseHash() {
	const hashParts = window.location.hash.slice(1).split(';');
	let page = 1;
	let expandedAddress = '';
	let search = '';
	hashParts.forEach(pair => {
		const [key, value] = pair.split('=');
		switch(key) {
			case 'page':
				page = Number(value);
				break;
			case 'oracle':
			expandedAddress = value;
				break;
			case 'search':
				search = value;
				break;
		}
	});
	return {page, expandedAddress, search};
}

function navigate(params) {
	const url = '#' + makeHash({...parseHash(), ...params});
	window.location.href = url;
}

function makeHash(params, prevParams = {}) {
	const parts = [];
	parts.push('page=' + (params.page || prevParams.page || 1));
	parts.push('search=' + (params.search || prevParams.search || ''));
	parts.push('oracle=' + (params.expandedAddress || prevParams.expandedAddress || ''));
	return parts.join(';');
}

function renderPagination(container, pages, hash) {
	while (container.firstChild) container.removeChild(container.firstChild);
	const fragment = document.createDocumentFragment();
	pages.forEach(page => {
		const active = page === hash.page;
		const li = fragment.appendChild(document.createElement('li'));
		if (active) li.className = 'active';
		const a = li.appendChild(document.createElement('a'));
		a.href = '#' + makeHash({page, expandedAddress: ''}, hash);
		a.textContent = page;
	});
	container.appendChild(fragment);
}

function clearOraclesRows(oraclesContainer, rows) {
	rows.forEach(row => {
		if (!row.tr) return;
		try {
			oraclesContainer.removeChild(row.tr);
		} catch (e) {
			console.warn(e);
		}
	});
}

function loadCSS(href) {
	const css = document.createElement('link');
	css.rel = 'stylesheet';
	css.href = href;
	document.getElementsByTagName('head')[0].appendChild(css);
}

loadCSS('https://cdnjs.cloudflare.com/ajax/libs/dialog-polyfill/0.4.10/dialog-polyfill.min.css');
loadCSS('https://cdnjs.cloudflare.com/ajax/libs/font-awesome/4.7.0/css/font-awesome.min.css');
loadCSS('https://cdnjs.cloudflare.com/ajax/libs/github-markdown-css/2.10.0/github-markdown.min.css');
loadCSS('https://fonts.googleapis.com/css?family=Open+Sans:400,600,800');