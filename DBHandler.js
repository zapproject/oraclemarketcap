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



function setProviders(providerAddress, providerTitle){

	sql = "INSERT INTO providers (provider_address, provider_title) VALUES (?,?) ON DUPLICATE KEY UPDATE provider_address = provider_address";
	
	pool.query(sql, [providerAddress, providerTitle],function(err, result) {
			if (err) throw err;
			console.log("Inserted correctly");
	});

}

function setEndpoints(provider, endptUtf, constants, parts, dividers){

	sql = "INSERT INTO endpoints (provider_address, endpoint_name, constants, parts, dividers) VALUES (?,?,?,?,?) ON DUPLICATE KEY UPDATE endpoint_name = endpoint_name";
		await con.query(sql, [provider, endptUtf, constants, parts, dividers], function(err) {
			if(err) throw(err)
		});
}

function setBondage(endpointName,providerAddress){
	var numDots = await bondage.getDotsIssued({ provider: providerAddress, endpoint: endpointName });
	console.log("numDots "+numDots)

	var dotCost = await bondage.currentCostOfDot({ provider: providerAddress, endpoint: endpointName, dots: numDots });
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
}