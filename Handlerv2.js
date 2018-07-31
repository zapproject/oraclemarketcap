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
		console.log("Provider " + i + ":");
		console.log("\t"+providerAddress);
		console.log("\t"+providerTitle);
		console.log("\t"+providerKey);

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
	registry.listenNewProvider({}, function(error, event) {
		if(error) throw(error);
		
		console.log(event);
		var log = event.returnValues;
		console.log("Providers returnValues" + log);

		var providerTitle = log.title;
		providerTitle = web3.utils.toUtf8(providerTitle);
		var providerAddress = log.provider;
		//var providerKey = log.publicKey;

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

async function main() {
	try {

		//prove that node package works
		registry.getProviderTitle("0x014a87cc7954dd50a566a791e4975abaa49f8745")
		.then(title => console.log(title));

		//UNCOMMENT THIS LINE TO POPULATE PROVIDERS TABLE!!!!
		getAllProviders();

		listenNewProvider();
		listenNewCurve();
	}
	catch(error) {
		console.error(error);
	}
}
main();

