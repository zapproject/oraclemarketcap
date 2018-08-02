var Web3 = require("web3");
const util = require('util');

const contracts = require('./ContractsData');
const config = require("./config/config.json");

const DB = config.db;

const {ZapRegistry} = require('@zapjs/registry');
const {ZapBondage} = require('@zapjs/bondage');

const INFURA_URL = "wss://kovan.infura.io/ws";

var web3 = new Web3(new Web3.providers.WebsocketProvider(INFURA_URL));
var registry = new ZapRegistry({networkId: 42, networkProvider: new Web3.providers.WebsocketProvider(INFURA_URL)});
var bondage = new ZapBondage({networkId: 42, networkProvider: new Web3.providers.WebsocketProvider(INFURA_URL)});

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
		sql = "INSERT INTO providers (provider_address, provider_title) VALUES (?,?) ON DUPLICATE KEY UPDATE provider_address = provider_address";
		
		pool.query(sql, [providerAddress, providerTitle],function(err, result) {
				if (err) throw err;
				console.log("Inserted correctly");
		});
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

		var sql = "INSERT INTO providers (provider_address, provider_title) VALUES(?, ?)"
		pool.query(sql, [providerAddress, providerTitle], function(error, result) {
			if(!error)
			console.log(result);
			else {
				throw(error);
			}
		})
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

		var sql = "INSERT INTO endpoints (provider_address, endpoint_name, constants, parts, dividers) VALUES(?,?,?,?,?)"
		pool.query(sql, [provider, endpointName, constants, parts, dividers], function(error, result) {
			if(!error)
			console.log(result);
			else {
				throw(error);
			}
		})
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
		endptUtf = web3.utils.toUtf8(endptName);
		constants = String(regEvents[i].returnValues.constants);
		parts = String(regEvents[i].returnValues.parts);
		dividers = String(regEvents[i].returnValues.dividers);
		sql = "INSERT INTO endpoints (provider_address, endpoint_name, constants, parts, dividers) VALUES (?,?,?,?,?) ON DUPLICATE KEY UPDATE endpoint_name = endpoint_name";
		await con.query(sql, [provider, endptUtf, constants, parts, dividers], function(err) {
			if(err) throw(err)
		});
		console.log("Provider "+i+":");
		console.log("\t"+provider);
		console.log("\t"+endptUtf);
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
		console.log("Bond returnValues" + log);

		providerAddress = log.holder;
		endpointName = String(log.endpoint);
		endpointName = web3.utils.toUtf8(endpointName);
		console.log("endpointName : " + endpointName);
		console.log("holder : " + providerAddress);
		
		
		var numDots = await bondage.getDotsIssued({ provider: providerAddress, endpoint: endpointName });
		var dotCost = await bondage.currentCostOfDot({ provider: providerAddress, endpoint: endpointName, dots:numDots });
		var calcZap = await bondage.calcZapForDots({ provider: providerAddress, endpoint: endpointName, dots: numDots });

		sql1 = await "UPDATE endpoints SET zap_value=? WHERE endpoint_name=? AND provider_address=?";				
		sql2 = await "UPDATE endpoints SET dot_value=? WHERE endpoint_name=? AND provider_address=?";
		sql2_1 = await "UPDATE endpoints SET dot_issued=? WHERE endpoint_name=? AND provider_address=?";
		sql3 = await "SELECT sum(zap_value) AS total_zap_value FROM endpoints WHERE provider_address=?";
		sql4 = await "UPDATE providers SET total_zap_value=? WHERE provider_address=?";
		
		await pool.query(sql1, [calcZap, endpointName, providerAddress], async function(err, result) {
			if (err) throw err;
			await pool.query(sql2, [dotCost, endpointName, providerAddress], async function(err, result) {
				if (err) throw err;
				await pool.query(sql2_1, [numDots, endpointName, providerAddress], async function(err, result) {
				if (err) throw err;
					await pool.query(sql3, [providerAddress], async function(err, total) {
						if (err) throw err;
						await pool.query(sql4, [total[0].total_zap_value, providerAddress], function(err, result) {
							if (err) throw err;
						});
					});
				});
			});
		});
	});
}

async function listenUnbound() {
	bondage.listenUnbound({}, async function(error, result) {
		if(error) throw(error);
		
		console.log(result);
		var log = result.returnValues;
		console.log("Unbond returnValues" + log);

		providerAddress = log.holder;
		endpointName = String(log.endpoint);
		endpointName = web3.utils.toUtf8(endpointName);
		
		var numDots = await bondage.getDotsIssued({ provider: providerAddress, endpoint: endpointName });
		var dotCost = await bondage.currentCostOfDot({ provider: providerAddress, endpoint: endpointName, dots:numDots });
		var calcZap = await bondage.calcZapForDots({ provider: providerAddress, endpoint: endpointName, dots: numDots });

		sql1 = await "UPDATE endpoints SET zap_value=? WHERE endpoint_name=? AND provider_address=?";				
		sql2 = await "UPDATE endpoints SET dot_value=? WHERE endpoint_name=? AND provider_address=?";
		sql2_1 = await "UPDATE endpoints SET dot_issued=? WHERE endpoint_name=? AND provider_address=?";
		sql3 = await "SELECT sum(zap_value) AS total_zap_value FROM endpoints WHERE provider_address=?";
		sql4 = await "UPDATE providers SET total_zap_value=? WHERE provider_address=?";
		
		await pool.query(sql1, [calcZap, endpointName, providerAddress], async function(err, result) {
			if (err) throw err;
			await pool.query(sql2, [dotCost, endpointName, providerAddress], async function(err, result) {
				if (err) throw err;
				await pool.query(sql2_1, [numDots, endpointName, providerAddress], async function(err, result) {
				if (err) throw err;
					await pool.query(sql3, [providerAddress], async function(err, total) {
						if (err) throw err;
						await pool.query(sql4, [total[0].total_zap_value, providerAddress], function(err, result) {
							if (err) throw err;
						});
					});
				});
			});
		});
	});
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