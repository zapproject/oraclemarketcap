var Web3 = require("web3");
const util = require('util');

const contracts = require('./ContractsData');
const config = require("./config/config.json");

const DB = config.db;

const {ZapRegistry} = require('@zapjs/registry');
const {ZapBondage} = require('@zapjs/bondage');

const INFURA_URL = "wss://kovan.infura.io/ws";
const dbHandler =require("./DBHandler.js");
var web3 = new Web3(new Web3.providers.WebsocketProvider(INFURA_URL));
var registry = new ZapRegistry({networkId: 42, networkProvider: new Web3.providers.WebsocketProvider(INFURA_URL)});
var bondage = new ZapBondage({networkId: 42, networkProvider: new Web3.providers.WebsocketProvider(INFURA_URL)});

var BN = require("BN.js");

var mysql = require('mysql');
var pool = mysql.createPool({
	host: DB.db,
	user: DB.user,
	password: DB.password,
	database: DB.dbName 
});

var con = mysql.createConnection({ 
	host: DB.db,
	user: DB.user,
	password: DB.password,
	database: DB.dbName
});

pool.query('SELECT 1 + 1 AS solution', (error, results, fields) => {
        		if (error) throw error;
        		console.log('Database connection successfully established; Fetching data.');
        	});
        	
// shorthand for getConnection, query, releaseConnection
pool.query = util.promisify(pool.query);


async function getAllProviders() {
	var i = 0;
	do {
		var provider =  await registry.getNextProvider(i);

		var providerTitle = provider.title;
		providerTitle = web3.utils.toUtf8(providerTitle);
		var providerAddress = provider.oracleAddress;
		var providerKey = provider.publicKey;
		dbHandler.setProviders(providerAddress,providerTitle)

		console.log("Provider " + i + ":");
		console.log("\t"+providerAddress);
		console.log("\t"+providerTitle);
		console.log("\t"+providerKey);

		i = parseInt(provider.nextIndex);

	} while(i != 0);
}

async function listenNewProvider() {
	registry.listenNewProvider({}, function(error, event) {
		if(error) throw(error);
		
		console.log(event);
		var log = event.returnValues;
		console.log("Providers returnValues" + log);

		var providerTitle = log.title;
		providerTitle = web3.utils.toUtf8(providerTitle);
		var providerAddress = log.provider;
		dbHandler.setProviders(providerAddress,providerTitle)

	})
}

async function listenNewCurve() {
	registry.listenNewCurve({}, function(error, event) {
		if(error) throw(error);
		console.log(event);

		var log = event.returnValues;
		console.log("Try to pull only returnValues:" + log);

		provider = log.provider;
		endpointName = String(log.endpoint);
		endpointName = web3.utils.toUtf8(endpointName);
		constants = String(log.constants);
		parts = String(log.parts);
		dividers = String(log.dividers);
		dbHandler.setEndpoints(provider, endpointName, constants, parts, dividers)

	})

}

async function getPastRegistryEvents(eventName) {
	try {
		var logs = await contracts.zapRegistry.getPastEvents(eventName, {fromBlock:0, toBlock:'latest'});
		return logs;

	} catch (error) {
		console.log("Get Event Error!");
		console.error(error);
	}
}

async function getPastEndpoints() {
	//clears endpoint data before
	await con.connect(function (err) {
		if (err) throw err;
		console.log("Connected!");
	});
	var regEvents = await getPastRegistryEvents("NewCurve");
	for (let i in regEvents) {
		provider = regEvents[i].returnValues.provider;
		endptName = String(regEvents[i].returnValues.endpoint);
		endptName = web3.utils.toUtf8(endptName);
		constants = String(regEvents[i].returnValues.constants);
		parts = String(regEvents[i].returnValues.parts);
		dividers = String(regEvents[i].returnValues.dividers);

		dbHandler.setEndpoints(provider, endptName, constants, parts, dividers)

		console.log("Provider "+i+":");
		console.log("\t"+provider);
		console.log("\t"+endptName);
		console.log("\t"+constants);
		console.log("\t"+parts);
		console.log("\t"+dividers);
	}
	con.end();
}

async function listenBound() {
	bondage.listenBound({}, async function(error, result) {
		if(error) throw(error);
		
		console.log(result);
		var log = result.returnValues;

		providerAddress = log.oracle;
		endpointName = String(log.endpoint);
		endpointName = web3.utils.toUtf8(endpointName);
		console.log("endpointName : " + endpointName);
		console.log("holder : " + providerAddress);

		var numDots = await bondage.getDotsIssued({ provider: providerAddress, endpoint: endpointName });
		var dotCost = await bondage.currentCostOfDot({ provider: providerAddress, endpoint: endpointName, dots: numDots });
		var calcZap = await bondage.calcZapForDots({ provider: providerAddress, endpoint: endpointName, dots: 1 });

		dotCost = web3.utils.fromWei(new BN(String(dotCost)), 'ether');
		calcZap = web3.utils.fromWei(new BN(String(calcZap)), 'ether');
		
		dbHandler.setBondage(endpointName,providerAddress, calcZap, dotCost, numDots);
	})
}

async function listenUnbound() {
	bondage.listenUnbound({}, async function(error, result) {
		if(error) throw(error);
		
		console.log(result);
		var log = result.returnValues;
		
		providerAddress = log.oracle;
		endpointName = String(log.endpoint);
		endpointName = web3.utils.toUtf8(endpointName);

		var numDots = await bondage.getDotsIssued({ provider: providerAddress, endpoint: endpointName });
		var dotCost = await bondage.currentCostOfDot({ provider: providerAddress, endpoint: endpointName, dots: numDots });
		var calcZap = await bondage.calcZapForDots({ provider: providerAddress, endpoint: endpointName, dots: 1 });

		dotCost = web3.utils.fromWei(new BN(String(dotCost)), 'ether');
		calcZap = web3.utils.fromWei(new BN(String(calcZap)), 'ether');

		dbHandler.setBondage(endpointName,providerAddress, calcZap, dotCost, numDots);
	})
}

async function main() {
	try {
		getAllProviders();
		getPastEndpoints();
		listenNewProvider();
		listenNewCurve();
		listenBound();
		listenUnbound();
	}
	catch(error) {
		console.error(error);
	}
}

main();