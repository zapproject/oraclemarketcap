$( document ).ready(function() {
	init();
});


async function init(){
	console.log("Init");
	if (typeof web3 !== 'undefined'){
		initWeb3();
	} else {
		alert("PLEASE GET METAMASK");
		return;
	}

	// create the registry object
	options = {
		networkId: 42,
		networkProvider: web3.currentProvider
	};
	window.registry = new zapjs.ZapRegistry(options);
	window.bondage = new zapjs.ZapBondage(options);

	await loadOracles();
	render();
}

//Initializer for Web3. Also calls the initializer for the smart contract.
function initWeb3() {
    // Is there is an injected web3 instance?
    if (typeof web3 !== 'undefined') {
    	web3Provider = web3.currentProvider;
    } else {
        // If no injected web3 instance is detected, CAN'T register
        alert("PLEASE INSTALL METAMASK");
    }
    web3 = new Web3(web3Provider);
}


// loads all the oracle data from contracts
async function loadOracles(){
	window.data = {};
	let oracles = await window.registry.getAllProviders();

	for(var i=0; i<oracles.length; i++){
		let addr = oracles[i];
		let endpoints = await window.registry.getProviderEndpoints(addr);
		if(endpoints.length == 0) continue;
		let title = await window.registry.getProviderTitle(addr);

		let obj = {
			address: addr,
			title: title,
			endpoints: {}
		};
		// TODO: get provider params

		// get data for each endpoint
		for(var j=0; j<endpoints.length; j++){ 
			let spec = endpoints[j];
			let key = addr + "_" + spec;
			let curve = await window.registry.getProviderCurve(addr, spec);
			//let endpointParams = await window.registry.getEndpointParams(addr, spec);
			let boundDots = await window.bondage.getDotsIssued({provider: addr, endpoint: spec});
			let boundZap = await window.bondage.getZapBound({provider: addr, endpoint: spec});
			let nextPrice = await window.bondage.calcZapForDots({provider: addr, endpoint: spec, dots: 1});
			
			let endpointObj = { // TODO: add endpoint params
				endpoint: spec,
				curve: curve,
				boundDots: boundDots,
				boundZap: boundZap,
				price: nextPrice
			};
			obj.endpoints[spec] = endpointObj;
		}
		window.data[addr] = obj;
	}
}


// renders the display
function render(){
	console.log("Rendering");
	for (var provider in window.data) {
		if (!window.data.hasOwnProperty(provider)) continue;
		let oracle = window.data[provider];
		for (var endpoint in oracle["endpoints"]) {
			if (!oracle["endpoints"].hasOwnProperty(endpoint)) continue;
			createRow(provider, endpoint);
		}
	}
}

function createRow(provider, endpoint){
	console.log("ROW:", provider, endpoint);
	let oracle = window.data[provider];
	let obj = oracle["endpoints"][endpoint];

	let out = '<tr class="provider-listing">';
	out += `<td>${oracle.title}</td>`;
	out += `<td>${oracle.address}</td>`;
	out += `<td>${endpoint}</td>`;
	out += `<td>${obj.boundZap}</td>`;
	out += `<td>${obj.boundDots}</td>`;
	out += `<td>${obj.price}</td>`;
	out += `<td>${curveToString(obj.curve)}</td>`;
	out += `<td>${"CHANGE"}</td>`;
	out += "</tr>";

	$('.provider-table tr:last').after(out);
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
			str += 	"x^" + pow;
		}
	}
	return str;
}