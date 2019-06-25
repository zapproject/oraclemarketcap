class OracleMarketCap {
	constructor() {
		this.selectRef = document.getElementById('network-select');
		this.searchRef = document.getElementById('search-term');
		this.paginationRef = document.getElementById('pagination');
		this.oraclesContainerRef = document.getElementById('provider-labels').parentElement;
		this.dialogRef = document.getElementById('dialog');

		this.networks = [
			{
				name: 'Kovan',
				networkProvider: 'wss://kovan.infura.io/ws',
				networkId: 42
			},
			{
				name: 'Mainnet',
				networkProvider: 'wss://mainnet.infura.io/ws',
				networkId: 1,
				// disabled: true
			},
			{
				name: 'Localhost 8546',
				networkProvider: 'ws://localhost:8546',
				networkId: 1337,
				// disabled: true
			}
		];
		this.providersService = null;
		this.firstExpand = true;
		this.pageSize = 10;
		this.allProviderAddresses;
		this.prevHash = {
			expandedAddress: '',
			page: 1,
			search: ''
		};
		this.currentExpandedAddress = '';
		this.prevRenderedOracles = [];

		this.handleNetworkChange = this.handleNetworkChange.bind(this);
		this.locationChanged = this.locationChanged.bind(this);
		this.handleClick = this.handleClick.bind(this);


		initSelect(this.selectRef, this.networks, this.handleNetworkChange);
		initFilter(this.searchRef, search => navigate({search, page: 1}), parseHash().search);
		window.addEventListener('hashchange', this.locationChanged);
		this.oraclesContainerRef.addEventListener('click', this.handleClick);

		window.addEventListener('load', async () => {
			dialogPolyfill.registerDialog(this.dialogRef);
			await this.handleNetworkChange(this.networks[0]);
			this.locationChanged().catch(console.log);
		});

		this.dialogRef.addEventListener('close', () => {
			this.closeDialog();
		});
		this.dialogRef.addEventListener('click', e => {
			if (e.target.className !== 'close') return;
			e.preventDefault();
			this.closeDialog();
		});
	}

	handleClick(e) {
		const className = e.target.className;
		switch (className) {
			case 'fold-icon':
				this.collapse(e);
				break;
			case 'copy-icon':
				handleCopy(e);
				break;
		}
	}

	collapse(e) {
		if (this.prevHash.expandedAddress.indexOf(e.target.getAttribute('data-oracle')) !== 0) return;
		requestAnimationFrame(() => {
			navigate({expandedAddress: ''});
		});
	}

	handleExpandAndNavigate(address, prevAddress) {
		const oracleAddress = address.slice(0, 42);
		const prevOracleAddress = prevAddress.slice(0, 42);
		if (oracleAddress !== prevOracleAddress) {
			foldOracles(prevOracleAddress, this.prevRenderedOracles);
		}
		if (prevAddress) {
			const prevHighlight = document.getElementById('_' + prevAddress) || document.getElementsByClassName(prevOracleAddress)[0];
			if (prevHighlight) setTimeout(() => { prevHighlight.classList.remove('highlight'); }, 1500);
		}
		unfoldOracles(oracleAddress, this.prevRenderedOracles);
		const element = document.getElementById('_' + address) || document.getElementsByClassName(oracleAddress)[0];
		if (!element) return;
		if (address.length > 42) element.classList.add('highlight');
		if ('scrollIntoView' in element) element.scrollIntoView({
			behavior: 'smooth',
			block: 'center',
			inline: 'center',
		});
		if (address) this.showDialog(address);
	}

	async showDialog(address) {
		const oracleAddress = address.slice(0, 42);
		const endpoint = address.slice(42);
		let i = this.prevRenderedOracles.length;
		let provider;
		while (i--) {
			if (this.prevRenderedOracles[i].oracle.provider.providerOwner !== oracleAddress) continue;
			provider = this.prevRenderedOracles[i].oracle.provider;
			break;
		}
		if (!provider) return;
		const param = endpoint || 'profile';
		const url = await getProviderParam(provider, param + '.md')
		if (!url) return;
		document.documentElement.classList.add('dialog-openned');
		const container = dialog.lastElementChild;
		container.innerHTML = `<p>Loading info ...<br>Provider: ${oracleAddress}` + (endpoint ? `<br>Endpoint: ${endpoint}</p>` : '');
		dialog.showModal();
		getUrlText(url).then(response => {
			container.innerHTML = marked(response);
		}).catch(error => {
			const p = document.createElement('p');
			p.textContent = error.message;
			container.appendChild(p);
		});
	}

	closeDialog() {
		if (this.dialogRef.hasAttribute('open')) this.dialogRef.close();
		document.documentElement.classList.remove('dialog-openned');
	}

	async locationChanged() {
		this.closeDialog();
		const hash = parseHash();
		const { page, expandedAddress, search } = this.prevHash;
		/* const oracleAddress = hash.expandedAddress.slice(0, 42);
		if (hash.expandedAddress && expandedAddress !== hash.expandedAddress) {
			const expandedAddressPage = getPageForItem(oracleAddress, this.allProviderAddresses, this.pageSize);
			if (expandedAddressPage > 0) hash.page = expandedAddressPage;
		} */
		this.prevHash = hash;
		if (this.firstExpand || hash.page !== page || hash.search !== search) {
			this.firstExpand = false;
			clearOraclesRows(this.oraclesContainerRef, this.prevRenderedOracles);
			const { items, total } = await this.getOracles(hash.page, hash.search);
			renderPagination(this.paginationRef, getPages(hash.page, getTotalPages(total, this.pageSize)), hash);
			this.prevRenderedOracles = render(this.oraclesContainerRef, items, hash.oracle);
		}

		this.handleExpandAndNavigate(hash.expandedAddress, expandedAddress);
	}

	async handleNetworkChange(network) {
		this.firstExpand = true;
		clearOraclesRows(this.oraclesContainerRef, this.prevRenderedOracles);
		this.providersService = new ProvidersService(network.networkId, network.networkProvider);
		this.allProviderAddresses = await this.providersService.allProviderAddresses;
	}

	getOracles(page, search) {
		const start = getPageStart(page, this.pageSize);
		return search
			? this.providersService.search(search, start, this.pageSize)
			: this.providersService.getProviders(start, this.pageSize);
	}
}

new OracleMarketCap();