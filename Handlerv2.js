var Web3 = require("web3");
const util = require('util');

const {ZapRegistry} = require('@zapjs/registry');
const {ZapBondage} = require('@zapjs/bondage');

const {Artifacts} = require('@zapjs/artifacts');

const INFURA_URL = "https://kovan.infura.io/xeb916AFjrcttuQlezyq";
var web3 = new Web3(new Web3.providers.HttpProvider(INFURA_URL));


var registry = new ZapRegistry({networkId: 42, networkProvider: new Web3.providers.HttpProvider(INFURA_URL)});
var bondage = new ZapBondage({networkId: 42, networkProvider: new Web3.providers.HttpProvider(INFURA_URL)});

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


async function getAllProviders() {
	var i = 0;
	do {
		var provider =  await registry.getNextProvider(i);

		var providerTitle = provider.title;
		providerTitle = web3.utils.toUtf8(providerTitle);
		var providerAddress = provider.oracleAddress;
		var providerKey = provider.publicKey;
		sql = "INSERT INTO providers (provider_address, provider_title) VALUES (?,?)";
		
		pool.query(sql, [providerAddress, providerTitle],function(err, result) {
				if (err) throw err;
				console.log("Inserted correctly");
		});
		console.log(provider);
		// console.log(providerAddress);
		// console.log(providerTitle);
		// console.log(providerKey);

		i = parseInt(provider.nextIndex);

	} while(i != 0);
}

async function getBoundZapEndpoints() {
	var getSql = "SELECT * FROM endpoints";
	pool.query(getSql, async function(err, result) {
			if (err) throw err;
			if(result.length < 1)
				return;
			console.log(result);
			for (let i in result) {
				endpointName = result[i].endpointName;
				//endpointNameHex = web3.utils.utf8ToHex(endpointName);
				providerAddress = result[i].providerAddress;

				var numDots = await bondage.getDotsIssued({ provider: providerAddress, endpoint: endpointName });
				var dotCost = await bondage.currentCostOfDot({ provider: providerAddress, endpoint: endpointName, dots:1 });
				var calcZap = await bondage.calcZapForDots({ provider: providerAddress, endpoint: endpointName, dots: numDots });

				sql1 = await "UPDATE endpoints SET zap_value=? WHERE endpoint_name=? AND provider_address=?";				
				sql2 = await "UPDATE endpoints SET dot_value=? WHERE endpoint_name=? AND provider_address=?";
				
				await pool.query(sql1, [calcZap, endptName, provAddr], function(err, result) {
					if (err) throw err;
				});
				await pool.query(sql2, [dotCost, endptName, provAddr], function(err, result) {
					if (err) throw err;
				});
				console.log("iteration "+i+" finished");
			}
		});
}


async function listenNewProvider() {
	var filters = '';
	registry.listenNewProvider(filters, function(error, endpoint) {
		if(error) throw(error);
		console.log(provider);
		
		var providerTitle = provider.title;
		providerTitle = web3.utils.toUtf8(providerTitle);
		var providerAddress = provider.oracleAddress;
		var providerKey = provider.publicKey;

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
	var filters = '';
	registry.listenNewCurve(filters, function(error, endpoint) {
		if(error) throw(error);
		console.log(endpoint);
		
		provider = endpoint.provider;
		endpointName = String(endpoint.endpoint);
		endpointName = web3.utils.toUtf8(endpointName);
		constants = String(endpoint.constants);
		parts = String(endpoint.parts);
		dividers = String(endpoint.dividers);

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

async function main() {
	try {

		//prove that node package works
		registry.getProviderTitle("0x014a87cc7954dd50a566a791e4975abaa49f8745")
		.then(title => console.log(title));

		//UNCOMMENT THIS LINE TO POPULATE PROVIDERS TABLE!!!!
		//getAllProviders();

		var constants = [2,2,0,5,0,0,3,1,1];
		var parts = [0,5,5,100];
		var dividers = [2,3];

		var key = web3.utils.toBN(111);
		var gasLimit = web3.utils.toBN(6000000);
		
		console.log(key);
		console.log(gasLimit);

		var spec1 = web3.utils.utf8ToHex("test");
		var params = [ "param1" , "param2" ];
		var title = web3.utils.utf8ToHex("TestingNodePackage");
		var filters= "";

		var metamaskWallet = "0x5Df6ACc490a34f30E20c740D1a3Adf23Dc4D48A2";

		registry.listenNewProvider(filters, console.log());
		registry.listenNewCurve(filters, console.log());

		registry.initiateProvider({
			public_key: 123,
			title: "TestNodePackage", 
			endpoint: "endpoint1", 
			endpoint_params: params, 
			from: metamaskWallet,
			gas: 6000000
		})
		.then(result => {
			console.log(result);
		})

	}
	catch(error) {
		console.error(error);
	}
}
main();

