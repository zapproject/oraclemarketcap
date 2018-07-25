const contracts = require("./ContractsData");
const assert = require("assert");
var Web3 = require("web3");
var web3 = new Web3(new Web3.providers.HttpProvider("http://localhost:9545"));
// var redis = require('redis');
// var client = redis.createClient();
//can also customize port and ip: var client = redis.createClient(port, host);
var mysql = require('mysql');
var con = mysql.createConnection({
	host: "localhost",
	user: "root",
	password: "",
	database: "oraclemarketcap"
});


async function getMostRecentRegistryEvent(eventToListenFor) {
    try{
        var logs = await contracts.zapRegistry.getPastEvents(eventToListenFor, {fromBlock:0, toBlock:'latest'});
        if(logs.length < 1)
            return logs;
        else {
            return logs[logs.length-1];
        }
    }
    catch(error){
        console.log("getIncomingEvent Error!");
        console.error(error);
    }
}

async function DoThings() {
	try {
		// client.on('connect', function() {
		// 	console.log('Redis client connected');
		// })
		// client.on('error', function(err) {
		// 	console.log('Something went wrong ' + err);
		// });

		con.connect(function(err) {
			if (err) throw err;
			console.log("Connected!");
		})

		var accounts = await web3.eth.getAccounts();
		var ethBalance = await web3.eth.getBalance(accounts[0]);
		ethBalance = web3.utils.fromWei(ethBalance.toString());
		console.log("Eth balance: " + accounts[0] +  " = " + ethBalance);
		
		var spec1 = web3.utils.utf8ToHex("Offchain");
		var spec2 = web3.utils.utf8ToHex("Onchain");
		var spec3 = web3.utils.utf8ToHex("Nonproviders");
		var params = [web3.utils.utf8ToHex("param1"), web3.utils.utf8ToHex("param2")];
		var title = web3.utils.utf8ToHex("DummyProvider");

		var constants = [2,2,0,5,0,0,3,1,1];
		var parts = [0,5,5,100];
		var dividers = [2,3];


		var approveTokens = web3.utils.toBN("1000e18");

		var tokensForOwner = web3.utils.toBN("5000e18");
		var tokensForProvider = web3.utils.toBN("3000e18");

		var allo = await contracts.zapToken.methods.allocate(accounts[0],tokensForOwner).send({from: accounts[0]});
		
		var zapOwnApprove = await contracts.zapToken.methods.approve(contracts.zapBondage._address, approveTokens).send({from: accounts[0]});
		var zapApprove = await contracts.zapToken.methods.approve(contracts.zapBondage._address, approveTokens).send({from: accounts[1]});
		var initProv = await contracts.zapRegistry.methods.initiateProvider(54321, title, spec1, params).send({from: accounts[4], gas: 6000000});
		var initProvCurve = await contracts.zapRegistry.methods.initiateProviderCurve(spec1, constants, parts, dividers).send({from: accounts[4], gas: 6000000});
		var initProvCurve = await contracts.zapRegistry.methods.initiateProviderCurve(spec2, constants, parts, dividers).send({from: accounts[4], gas: 6000000});
		var initProvCurve = await contracts.zapRegistry.methods.initiateProviderCurve(spec3, constants, parts, dividers).send({from: accounts[4], gas: 6000000});
		var bond1 = await contracts.zapBondage.methods.bond(accounts[4], spec1, 100).send({from: accounts[0], gas: 6000000});

		var initProv = await contracts.zapRegistry.methods.initiateProvider(54321, title, spec1, params).send({from: accounts[5], gas: 6000000});
		var initProvCurve = await contracts.zapRegistry.methods.initiateProviderCurve(spec1, constants, parts, dividers).send({from: accounts[5], gas: 6000000});
		var initProvCurve = await contracts.zapRegistry.methods.initiateProviderCurve(spec2, constants, parts, dividers).send({from: accounts[5], gas: 6000000});
		var initProvCurve = await contracts.zapRegistry.methods.initiateProviderCurve(spec3, constants, parts, dividers).send({from: accounts[5], gas: 6000000});
		var bond2 = await contracts.zapBondage.methods.bond(accounts[5], spec1, 100).send({from: accounts[0], gas: 6000000});

		var initProv = await contracts.zapRegistry.methods.initiateProvider(54321, title, spec1, params).send({from: accounts[6], gas: 6000000});
		var initProvCurve = await contracts.zapRegistry.methods.initiateProviderCurve(spec1, constants, parts, dividers).send({from: accounts[6], gas: 6000000});
		var initProvCurve = await contracts.zapRegistry.methods.initiateProviderCurve(spec2, constants, parts, dividers).send({from: accounts[6], gas: 6000000});
		var initProvCurve = await contracts.zapRegistry.methods.initiateProviderCurve(spec3, constants, parts, dividers).send({from: accounts[6], gas: 6000000});
		var bond3 = await contracts.zapBondage.methods.bond(accounts[6], spec1, 100).send({from: accounts[0], gas: 6000000});

		// var regEvent1 = await getMostRecentRegistryEvent("NewProvider");
		// var regEvent2 = await getMostRecentRegistryEvent("NewCurve");
		var regEvent1 = await contracts.zapRegistry.getPastEvents("NewProvider", {fromBlock:0, toBlock:'latest'});
		var regEvent2 = await contracts.zapRegistry.getPastEvents("NewCurve", {fromBlock:0, toBlock:'latest'});
		var allEvents = [];
		var strings = [];
		// for (let i in regEvent2) {
		// 	allEvents.push(regEvent2[i].returnValues);
		// }

		for (let i in regEvent1) {
			// var prov = regEvent1[i].returnValues.provider;
			// var title = regEvent1[i].returnValues.title;
			// var endpt = regEvent1[i].returnValues.endpoint;
			providerAddr = regEvent1[i].returnValues.provider;
			providerTitle = String(regEvent1[i].returnValues.title);
			providerTitle = web3.utils.toUtf8(providerTitle);
			// console.log(providerTitle);
			sql = "INSERT INTO provider (providerAddress, providerTitle) VALUES ('" + providerAddr +"', '" + providerTitle+"')";
			con.query(sql, function(err, result) {
				if (err) throw err;
				console.log("Inserted correctly");
			});
			for (let n in regEvent2) {
				if (regEvent2[n].returnValues.provider == providerAddr) {
					provider = regEvent2[n].returnValues.provider;
					endptName = String(regEvent2[n].returnValues.endpoint);
					endptName = web3.utils.toUtf8(endptName);
					constants = String(regEvent2[n].returnValues.constants);
					parts = String(regEvent2[n].returnValues.parts);
					dividers = String(regEvent2[n].returnValues.dividers);
					sql = "INSERT INTO endpoint (providerAddress, endpointName, constant, part, divider) VALUES" +
					"('" + provider +"', '"+ endptName+"', '"+constants+"', '"+parts+"', '"  + dividers+"')";
					con.query(sql, function(err, result) {
						if (err) throw err;
						console.log("Inserted correctly");
					});

				}
			}

		}
		provAddrData = [];
		endptData = [];
		sql = "SELECT providerAddress FROM provider";
		con.query(sql, function(err, result) {
			if (err) throw err;
			for (let i in result) {
				provAddrData.push(result[i].providerAddress);
			}
			for (let i in provAddrData) {
				sql = "SELECT * FROM endpoint WHERE providerAddress='" + provAddrData[i] + "'";	
				// console.log(sql);
				con.query(sql, async function(err, result) {
					if (err) throw err;
					for (let n in result) {
						endptName = result[n].endpointName;
						endptNameHex = web3.utils.utf8ToHex(endptName);
						var numDots = await contracts.zapBondage.methods.getDotsIssued(provAddrData[i],endptNameHex).call();
						console.log(numDots);
						var dotCost = await contracts.zapBondage.methods.currentCostOfDot(provAddrData[i],endptNameHex,1).call();
						var calcZap = await contracts.zapBondage.methods.calcZapForDots(provAddrData[i],endptNameHex,numDots).call();
						console.log(dotCost);
						console.log(calcZap);
						sql = "UPDATE endpoint SET zapValue="+calcZap+" WHERE endpointName='"+endptName+"' AND providerAddress="+"'"+provAddrData[i]+"'";
						con.query(sql, function(err, result) {
							if (err) throw err;
						});
						console.log("updated zap value");
						sql = "UPDATE endpoint SET dotValue="+dotCost+" WHERE endpointName='"+endptName+"' AND providerAddress="+"'"+provAddrData[i]+"'";
						con.query(sql, function(err, result) {
							if (err) throw err;
						});
						console.log("updated dot value");
					}
					// console.log(result);
			});
		};
		});

	} catch(error) {
		console.log("Error!");
		console.log(error);
	}

	
}

DoThings();