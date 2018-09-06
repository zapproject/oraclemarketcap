var Web3 = require("web3");
const util = require('util');

// const contracts = require('./ContractsData');
const config = require("./config/config.json");

const DB = config.db;

const {ZapRegistry} = require('@zapjs/registry');
const {ZapBondage} = require('@zapjs/bondage');
const {ZapProvider} = require('@zapjs/provider');
const INFURA_URL = "wss://kovan.infura.io/ws";
const dbHandler =require("./DBHandler.js");
var web3 = new Web3(new Web3.providers.WebsocketProvider(INFURA_URL));
var registry = new ZapRegistry({networkId: 42, networkProvider: new Web3.providers.WebsocketProvider(INFURA_URL)});
var bondage = new ZapBondage({networkId: 42, networkProvider: new Web3.providers.WebsocketProvider(INFURA_URL)});
const path_1 = require("path");


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

async function loadProvider(owner) {
    const contracts = {
        networkId: 42,
        networkProvider: new Web3.providers.WebsocketProvider(INFURA_URL),
    };
    const handler = {
        handleIncoming: (data) => {
            console.log('handleIncoming', data);
        },
        handleUnsubscription: (data) => {
            console.log('handleUnsubscription', data);
        },
        handleSubscription: (data) => {
            console.log('handleSubscription', data);
        },
    };
    return new ZapProvider(owner, Object.assign(contracts, { handler }));
}
function curveString(curve) {
    if (curve.length == 0) {
        return "Empty curve";
    }
    let output = "";
    let start = 1;
    let index = 0;
    while (index < curve.length) {
        // 3 0 0 0 2 1000
        const length = +curve[index];
        const base = index + 1;
        const poly = curve.slice(base, base + length);
        const end = +curve[base + length];
        output += poly.map((x, i) => {
            if (x == 0) {
                return '';
            }
            switch (i) {
                case 0: return `${x}`;
                case 1: return `${x > 1 ? x : ''}x`;
                default: return `${x > 1 ? x : ''}x^${i}`;
            }
        }).filter(x => x.length > 0).join(" + ") + ` on (${start} to ${end}]\n`;
        index = base + length + 1;
        start = end;
    }
    return output;
}
async function populateDatabase() {
	var addresses = await registry.getAllProviders();
	console.log(addresses);
	if (addresses.length == 0) {
        console.log(`Didn't find any providers`);
        return;
    }
    const providers = await Promise.all(addresses.map(address => loadProvider(address)));
   for (const provider of providers) {
   		const title = await provider.getTitle();
        const endpoints = await provider.getEndpoints();
        const address=provider.providerOwner;
    	dbHandler.setProviders(address,title)

        for (const endpoint of endpoints) {
			const curve = String((await provider.getCurve(endpoint)).values);
			dbHandler.setEndpoints(address,title,curve);
        }
    }
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
		curve = String(log.constants);
		dbHandler.setEndpoints(provider, endpointName, curve)

	})

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
		populateDatabase();
		
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