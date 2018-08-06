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


// SERVER.JS

function getProviders(){
	var query = "SELECT * FROM providers";
	pool.query(query, function(err, results) {
		if(!err) {
			res.json({data: results});
		}
		else 
			handleError(req, res, err);
	});

}
function getProvidersByAddress(address){
	var query = "SELECT * FROM providers WHERE provider_address=?";
	pool.query(query, address, function(err, results) {
		if(!err) {
			res.json({data: results});
		}
		else 
			handleError(req, res, err);
	});
	
}
function getProvidersByTitle(title){
	var query = "SELECT * FROM providers WHERE provider_title=?";
	pool.query(query, title, function(err, results) {
		if(!err) {
			res.json({data: results});
		}
		else 
			handleError(req, res, err);
	});
	
}
function getProvidersByZap(orderBy){
	var query;
	if(orderBy)
	query = "SELECT * FROM providers WHERE total_zap_value ORDER BY total_zap_value asc";
	else
	query = "SELECT * FROM providers WHERE total_zap_value ORDER BY total_zap_value desc";

	pool.query(query,function(err, results) {
		if(!err) {
			res.json({data: results});
		}
		else 
			handleError(req, res, err);
	});
	
}
function getProvidersLastUpdated(){
	var query = "SELECT * FROM providers ORDER BY timestamp DESC";
	pool.query(query, function(err, results) {
		if(!err) {
			res.json({data: results});
		}
		else 
			handleError(req, res, err);
	});
	
}

// Endpoints

function getEndpoints(){
var query = "SELECT * FROM endpoints";
	pool.query(query, function(err, results) {
		if(!err) {
			res.json({data: results});
		}
		else 
			handleError(req, res, err);
	});

}
function getEndpointsByAddress(address){
var query = "SELECT * FROM endpoints WHERE provider_address=?";
	pool.query(query, address, function(err, results) {
		if(!err) {
			res.json({data: results});
		}
		else 
			handleError(req, res, err);
	});

}
function getEndpointsByName(name){
var query = "SELECT * FROM endpoints WHERE endpoint_name=?";
	pool.query(query, name, function(err, results) {
		if(!err) {
			res.json({data: results});
		}
		else 
			handleError(req, res, err);
	});

}
function getEndpointsByZapValue(){
	var query;
	if(orderBy)
	query = "SELECT * FROM endpoints WHERE zap_value ORDER BY zap_value asc";
	else
	query = "SELECT * FROM endpoints WHERE zap_value ORDER BY zap_value desc";
	pool.query(query, function(err, results) {
		if(!err) {
			res.json({data: results});
		}
		else 
			handleError(req, res, err);
	});

}
function getEndpointsByDotValue(orderBy){
	var query;
	if(orderBy)
	query = "SELECT * FROM endpoints WHERE dot_value ORDER BY dot_value asc";
	else
	query = "SELECT * FROM endpoints WHERE dot_value ORDER BY dot_value desc";
	
	pool.query(query, function(err, results) {
		if(!err) {
			res.json({data: results});
		}
		else 
			handleError(req, res, err);
	});

}
function getEndpointsByDotIssued(orderBy){
	var query;
	if(orderBy) 
	query = "SELECT * FROM endpoints WHERE dot_issued ORDER BY dot_issued asc";
	else
	query = "SELECT * FROM endpoints WHERE dot_issued ORDER BY dot_issued desc";
	pool.query(query, function(err, results) {
		if(!err) {
			res.json({data: results});
		}
		else 
			handleError(req, res, err);
	});

}
function getEndpointsByTimeStamp(){
var query = "SELECT * FROM endpoints ORDER BY timestamp DESC";
	pool.query(query, function(err, results) {
		if(!err) {
			res.json({data: results});
		}
		else 
			handleError(req, res, err);
	});

}