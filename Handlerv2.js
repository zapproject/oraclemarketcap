var Web3 = require("web3");

const {ZapRegistry} = require('@zapjs/registry');
const {ZapBondage} = require('@zapjs/bondage');
const {Artifacts} = require('@zapjs/artifacts');

const INFURA_URL = "https://kovan.infura.io/xeb916AFjrcttuQlezyq";
var web3 = new Web3(new Web3.providers.HttpProvider(INFURA_URL));


var registry = new ZapRegistry({networkId: 42, networkProvider: new Web3.providers.HttpProvider(INFURA_URL)});
var bondage = new ZapBondage({networkId: 42, networkProvider: new Web3.providers.HttpProvider(INFURA_URL)});

var mysql = require('mysql');
var con = mysql.createConnection({
	host: "localhost",
	user: "root",
	password: "",
	database: "oraclemarketcap"
});

async function getAllProviders() {
	var i = 0;
	do {
		var provider =  await registry.getNextProvider(i);

		var providerTitle = provider.title;
		providerTitle = web3.utils.toUtf8(providerTitle);
		var providerAddress = provider.oracleAddress;
		var providerKey = provider.publicKey;
		sql = "INSERT INTO providers (provider_address, provider_title) VALUES (" + con.escape(providerAddress) +", " + con.escape(providerTitle)+")";
		
		con.query(sql, function(err, result) {
				if (err) throw err;
				console.log("Inserted correctly");
		});

		console.log(providerAddress);
		console.log(providerTitle);
		console.log(providerKey);

		i = parseInt(provider.nextIndex);

	} while(i != 0);
}

// async function getEndpoints() {
// 	var getSql = "SELECT * FROM endpoints";
// 	con.query(getSql, async function(err, result) {
// 			if (err) throw err;
// 			console.log(result);
// 			for (let i in result) {
// 				endptName = result[i].endpointName;
// 				endptNameHex = web3.utils.utf8ToHex(endptName);
// 				provAddr = result[i].providerAddress;
// 				var numDots = await ZapBondage.getDotsIssued(provAddr,endptNameHex);
// 				var dotCost = await ZapBondage.currentCostOfDot(provAddr,endptNameHex,1);
// 				var calcZap = await ZapBondage.calcZapForDots(provAddr,endptNameHex,numDots);
// 				sql1 = await "UPDATE endpoints SET zap_value="+con.escape(calcZap)+" WHERE endpoint_name=" + con.escape(endptName)+" AND provider_address=" + con.escape(provAddr);				
// 				sql2 = await "UPDATE endpoints SET dot_value="+con.escape(dotCost)+" WHERE endpoint_name=" + con.escape(endptName)+" AND provider_address=" + con.escape(provAddr);
// 				await con.query(sql1, function(err, result) {
// 					if (err) throw err;
// 				});
// 				await con.query(sql2, function(err, result) {
// 					if (err) throw err;
// 				});
// 				console.log("iteration "+i+" finished");
// 			}
// 		});
// }


async function listenNewProvider() {
	registry.listenNewProvider()
	.then(provider => {
		console.log(provider);

		// var providerTitle = provider.title;
		// providerTitle = web3.utils.toUtf8(providerTitle);
		// var providerAddress = provider.oracleAddress;
		// var providerKey = provider.publicKey;

	})
	.catch(console.error);
}

async function listenNewCurve() {
	registry.listenNewCurve()
	.then(endpoint => {
		console.log(endpoint);

		// provider = endpoint.provider;
		// endpointName = String(endpoint.endpoint);
		// endpointName = web3.utils.toUtf8(endpointName);
		// constants = String(endpoint.constants);
		// parts = String(endpoint.parts);
		// dividers = String(endpoint.dividers);
		// sql = "INSERT INTO endpoints (provider_address, endpoint_name, constants, parts, dividers) VALUES" +
		// "(" + con.escape(provider) +", " + con.escape(endpointName)+", " + con.escape(constants)+", " + con.escape(parts)+", " + con.escape(dividers)+")";
		// con.query(sql, function(err, result) {
		// 	if (err) throw err;
		// 	console.log("Inserted correctly");
		// });

	})
	.catch(console.error);
}

async function main() {
	try {

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
		var filters="";
		registry.listenNewProvider(filters, console.log());
		registry.listenNewCurve(filters, console.log());

		registry.initiateProvider({
			public_key: 123,
			title: "TestNodePackage", 
			endpoint: "endpoint1", 
			endpoint_params: params, 
			from: "0x5Df6ACc490a34f30E20c740D1a3Adf23Dc4D48A2",
			gas:6000000
		})
		.then(result => {
			console.log(result);
		})
		.catch(console.error);
		//await getEndpoints();
	}
	catch(error) {
		console.error(error);
	}
}
main();

