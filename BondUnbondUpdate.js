var Web3 = require("web3");
const util = require('util');

const {ZapRegistry} = require('@zapjs/registry');
const {ZapBondage} = require('@zapjs/bondage');

const {Artifacts} = require('@zapjs/artifacts');

//const INFURA_URL = "https://kovan.infura.io/xeb916AFjrcttuQlezyq";
const INFURA_URL = "wss://kovan.infura.io/ws";

var web3 = new Web3(new Web3.providers.WebsocketProvider(INFURA_URL));
var registry = new ZapRegistry({networkId: 42, networkProvider: new Web3.providers.WebsocketProvider(INFURA_URL)});
var bondage = new ZapBondage({networkId: 42, networkProvider: new Web3.providers.WebsocketProvider(INFURA_URL)});

var mysql = require('mysql');
var pool = mysql.createPool({
	host: "localhost",
	user: "root",
	password: "",
	database: "oraclemarketcap"
});

pool.query('SELECT 1 + 1 AS solution', (error, results, fields) => {
        		if (error) throw error;
        		console.log('Database connection successfully established; Fetching data.');
        	});
        	
// shorthand for getConnection, query, releaseConnection
pool.query = util.promisify(pool.query);

async function listenBoundEventsAndUpdate() {
	bondage.listenBound({}, async function(error, result) {
		if(error) throw(error);
		
		console.log(result);
		var log = result.returnValues;
		console.log("Bond returnValues" + log);

		providerAddress = log.holder;
		endpointName = String(log.endpoint);
		endpointName = web3.utils.toUtf8(endpointName);
		console.log("endpointName : " + endpointName);
		console.log("holder : " + providerAddress);
		
		
		var numDots = await bondage.getDotsIssued({ provider: providerAddress, endpoint: endpointName });
		var dotCost = await bondage.currentCostOfDot({ provider: providerAddress, endpoint: endpointName, dots:1 });
		var calcZap = await bondage.calcZapForDots({ provider: providerAddress, endpoint: endpointName, dots: numDots });

		sql1 = await "UPDATE endpoints SET zap_value=? WHERE endpoint_name=? AND provider_address=?";				
		sql2 = await "UPDATE endpoints SET dot_value=? WHERE endpoint_name=? AND provider_address=?";
		
		await pool.query(sql1, [calcZap, endpointName, providerAddress], function(err, result) {
			if (err) throw err;
		});
		await pool.query(sql2, [dotCost, endpointName, providerAddress], function(err, result) {
			if (err) throw err;
		});
	});
}

async function listenUnboundEventsAndUpdate() {
	bondage.listenUnbound({}, async function(error, result) {
		if(error) throw(error);
		
		console.log(result);
		var log = result.returnValues;
		console.log("Unbond returnValues" + log);

		providerAddress = log.holder;
		endpointName = String(log.endpoint);
		endpointName = web3.utils.toUtf8(endpointName);
		
		var numDots = await bondage.getDotsIssued({ provider: providerAddress, endpoint: endpointName });
		var dotCost = await bondage.currentCostOfDot({ provider: providerAddress, endpoint: endpointName, dots:1 });
		var calcZap = await bondage.calcZapForDots({ provider: providerAddress, endpoint: endpointName, dots: numDots });

		sql1 = await "UPDATE endpoints SET zap_value=? WHERE endpoint_name=? AND provider_address=?";				
		sql2 = await "UPDATE endpoints SET dot_value=? WHERE endpoint_name=? AND provider_address=?";
		
		await pool.query(sql1, [calcZap, endpointName, providerAddress], function(err, result) {
			if (err) throw err;
		});
		await pool.query(sql2, [dotCost, endpointName, providerAddress], function(err, result) {
			if (err) throw err;
		});
	});
}

async function main() {
	try {

		//prove that node package works
		registry.getProviderTitle("0x014a87cc7954dd50a566a791e4975abaa49f8745")
		.then(title => console.log(title));

		listenBoundEventsAndUpdate();
		listenUnboundEventsAndUpdate();
	}
	catch(error) {
		console.error(error);
	}
}

main();