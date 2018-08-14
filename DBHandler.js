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

var BN = require("BN.js");


class DBHandler{

constructor(){
	this.pool = mysql.createPool({
		host: DB.db,
		user: DB.user,
		password: DB.password,
		database: DB.dbName 
	});

	this.con = mysql.createConnection({ 
		host: DB.db,
		user: DB.user,
		password: DB.password,
		database: DB.dbName
	});

	this.pool.query('SELECT 1 + 1 AS solution', (error, results, fields) => {
	        		if (error) throw error;
	        		console.log('Database connection successfully established; Fetching data.');
	        	});
	        	
	// shorthand for getConnection, query, releaseConnection
	this.pool.query = util.promisify(this.pool.query);

}

async setProviders(providerAddress, providerTitle){

	let sql = "INSERT INTO providers (provider_address, provider_title) VALUES (?,?) ON DUPLICATE KEY UPDATE provider_address = provider_address";
	await this.pool.query(sql, [providerAddress, providerTitle]);

}

async setEndpoints(provider, endptUtf, constants, parts, dividers){

	let sql = "INSERT INTO endpoints (provider_address, endpoint_name, constants, parts, dividers) VALUES (?,?,?,?,?) ON DUPLICATE KEY UPDATE endpoint_name = endpoint_name";
	await this.con.query(sql, [provider, endptUtf, constants, parts, dividers])
}

async setBondage(endpointName,providerAddress, calcZap, dotCost, numDots){

	let sql1 = "UPDATE endpoints SET zap_value=? WHERE endpoint_name=? AND provider_address=?";				
	let sql2 = "UPDATE endpoints SET dot_value=? WHERE endpoint_name=? AND provider_address=?";
	let sql3 = "UPDATE endpoints SET dot_issued=? WHERE endpoint_name=? AND provider_address=?";
	let sql4 = "SELECT sum(zap_value) AS total_zap_value FROM endpoints WHERE provider_address=?";
	let sql5 = "UPDATE providers SET total_zap_value=? WHERE provider_address=?";
	
	await this.pool.query(sql1, [calcZap, endpointName, providerAddress])
	await this.pool.query(sql2, [dotCost, endpointName, providerAddress])
	await this.pool.query(sql3, [numDots, endpointName, providerAddress])
	var total = await this.pool.query(sql4, [providerAddress])
	await this.pool.query(sql5, [total[0].total_zap_value, providerAddress])
}


// SERVER.JS

async getProviders(){
	var query = "SELECT * FROM providers";
	let results = await this.pool.query(query)
	return results;

}
async getProvidersByAddress(address){
	var query = "SELECT * FROM providers WHERE provider_address=?";
	let results = await this.pool.query(query, address);
	return results;	
}
async getProvidersByTitle(title){
	var query = "SELECT * FROM providers WHERE provider_title=?";
	let results = await this.pool.query(query, title)
	return results;
}
async getProvidersByZap(orderBy){
	var query;
	if(orderBy)
	query = "SELECT * FROM providers WHERE total_zap_value ORDER BY total_zap_value asc";
	else
	query = "SELECT * FROM providers WHERE total_zap_value ORDER BY total_zap_value desc";
	
	let results = await this.pool.query(query)
	return results;
}
async getProvidersLastUpdated(){
	var query = "SELECT * FROM providers ORDER BY timestamp DESC";
	let results = await this.pool.query(query )
	return results;
}

// Endpoints

async getEndpoints(){
var query = "SELECT * FROM endpoints";
	let results = await this.pool.query(query )
	return results;
}
async getEndpointsByAddress(address){
var query = "SELECT * FROM endpoints WHERE provider_address=?";
	let results = await this.pool.query(query, address) 
	return results;
}
async getEndpointsByName(name){
var query = "SELECT * FROM endpoints WHERE endpoint_name=?";
	let results = await this.pool.query(query, name) 
	return results;
}

async getEndpointsByProviderTitle(title){
var query = "select providers.provider_title, endpoints.* from providers inner join endpoints on providers.provider_address=endpoints.provider_address where providers.provider_title= ?";
	let results = await this.pool.query(query, title) 
	return results;
}

async getEndpointsByZapValue(){
	var query;
	if(orderBy)
	query = "SELECT * FROM endpoints WHERE zap_value ORDER BY zap_value asc";
	else
	query = "SELECT * FROM endpoints WHERE zap_value ORDER BY zap_value desc";
	let results = await this.pool.query(query) 
	return results;
}
async getEndpointsByDotValue(orderBy){
	var query;
	if(orderBy)
	query = "SELECT * FROM endpoints WHERE dot_value ORDER BY dot_value asc";
	else
	query = "SELECT * FROM endpoints WHERE dot_value ORDER BY dot_value desc";
	
	let results = await this.pool.query(query) 
	return results;
}
async getEndpointsByDotIssued(orderBy){
	var query;
	if(orderBy) 
	query = "SELECT * FROM endpoints WHERE dot_issued ORDER BY dot_issued asc";
	else
	query = "SELECT * FROM endpoints WHERE dot_issued ORDER BY dot_issued desc";
	let results = await this.pool.query(query) 
	return results;
}
async getEndpointsLastUpdated(){
var query = "SELECT * FROM endpoints ORDER BY timestamp DESC";
	let results = await this.pool.query(query) 
	return results;
}

}
var dbHandler = new DBHandler();
module.exports = dbHandler;