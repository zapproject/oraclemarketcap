const contracts = require("./ContractsData");
const assert = require("assert");
var Web3 = require("web3");
var web3 = new Web3(new Web3.providers.HttpProvider("http://localhost:9545"));
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

async function main() {
	try {
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

		// var allo = await contracts.zapToken.methods.allocate(accounts[0],tokensForOwner).send({from: accounts[0]});
		
		// var zapOwnApprove = await contracts.zapToken.methods.approve(contracts.zapBondage._address, approveTokens).send({from: accounts[0]});
		// var zapApprove = await contracts.zapToken.methods.approve(contracts.zapBondage._address, approveTokens).send({from: accounts[1]});
		// var initProv = await contracts.zapRegistry.methods.initiateProvider(54321, title, spec1, params).send({from: accounts[4], gas: 6000000});
		// var initProvCurve = await contracts.zapRegistry.methods.initiateProviderCurve(spec1, constants, parts, dividers).send({from: accounts[4], gas: 6000000});
		// var initProvCurve = await contracts.zapRegistry.methods.initiateProviderCurve(spec2, constants, parts, dividers).send({from: accounts[4], gas: 6000000});
		// var initProvCurve = await contracts.zapRegistry.methods.initiateProviderCurve(spec3, constants, parts, dividers).send({from: accounts[4], gas: 6000000});
		// var bond1 = await contracts.zapBondage.methods.bond(accounts[4], spec1, 100).send({from: accounts[0], gas: 6000000});
		// var bond2 = await contracts.zapBondage.methods.bond(accounts[4], spec2, 100).send({from: accounts[0], gas: 6000000});
		// var bond3 = await contracts.zapBondage.methods.bond(accounts[4], spec3, 100).send({from: accounts[0], gas: 6000000});

		// var initProv = await contracts.zapRegistry.methods.initiateProvider(54321, title, spec1, params).send({from: accounts[5], gas: 6000000});
		// var initProvCurve = await contracts.zapRegistry.methods.initiateProviderCurve(spec1, constants, parts, dividers).send({from: accounts[5], gas: 6000000});
		// var initProvCurve = await contracts.zapRegistry.methods.initiateProviderCurve(spec2, constants, parts, dividers).send({from: accounts[5], gas: 6000000});
		// var initProvCurve = await contracts.zapRegistry.methods.initiateProviderCurve(spec3, constants, parts, dividers).send({from: accounts[5], gas: 6000000});
		// var bond1 = await contracts.zapBondage.methods.bond(accounts[5], spec1, 100).send({from: accounts[0], gas: 6000000});
		// var bond2 = await contracts.zapBondage.methods.bond(accounts[5], spec2, 100).send({from: accounts[0], gas: 6000000});
		// var bond3 = await contracts.zapBondage.methods.bond(accounts[5], spec3, 100).send({from: accounts[0], gas: 6000000});

		// var initProv = await contracts.zapRegistry.methods.initiateProvider(54321, title, spec1, params).send({from: accounts[6], gas: 6000000});
		// var initProvCurve = await contracts.zapRegistry.methods.initiateProviderCurve(spec1, constants, parts, dividers).send({from: accounts[6], gas: 6000000});
		// var initProvCurve = await contracts.zapRegistry.methods.initiateProviderCurve(spec2, constants, parts, dividers).send({from: accounts[6], gas: 6000000});
		// var initProvCurve = await contracts.zapRegistry.methods.initiateProviderCurve(spec3, constants, parts, dividers).send({from: accounts[6], gas: 6000000});
		// var bond1 = await contracts.zapBondage.methods.bond(accounts[6], spec1, 100).send({from: accounts[0], gas: 6000000});
		// var bond2 = await contracts.zapBondage.methods.bond(accounts[6], spec2, 100).send({from: accounts[0], gas: 6000000});
		// var bond3 = await contracts.zapBondage.methods.bond(accounts[6], spec3, 100).send({from: accounts[0], gas: 6000000});

		// var regEvent1 = await getMostRecentRegistryEvent("NewProvider");
		// var regEvent2 = await getMostRecentRegistryEvent("NewCurve");
		var regEvent1 = await contracts.zapRegistry.getPastEvents("NewProvider", {fromBlock:0, toBlock:'latest'});
		var regEvent2 = await contracts.zapRegistry.getPastEvents("NewCurve", {fromBlock:0, toBlock:'latest'});
		var allEvents = [];
		var strings = [];

		for (let i in regEvent1) {
			providerAddr = regEvent1[i].returnValues.provider;
			providerTitle = String(regEvent1[i].returnValues.title);
			providerTitle = web3.utils.toUtf8(providerTitle);
			sql = "INSERT INTO providers (provider_address, provider_title) VALUES (" + con.escape(providerAddr) +", " + con.escape(providerTitle)+")";
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
					sql = "INSERT INTO endpoints (provider_address, endpoint_name, constants, parts, dividers) VALUES" +
					"(" + con.escape(provider) +", " + con.escape(endptName)+", " + con.escape(constants)+", " + con.escape(parts)+", " + con.escape(dividers)+")";
					con.query(sql, function(err, result) {
						if (err) throw err;
						console.log("Inserted correctly");
					});

				}
			}

		}

		sql = "SELECT * FROM endpoints";
		con.query(sql, async function(err, result) {
			if (err) throw err;
			for (let i in result) {
				endptName = result[i].endpointName;
				endptNameHex = web3.utils.utf8ToHex(endptName);
				provAddr = result[i].providerAddress;
				var numDots = await contracts.zapBondage.methods.getDotsIssued(provAddr,endptNameHex).call();
				var dotCost = await contracts.zapBondage.methods.currentCostOfDot(provAddr,endptNameHex,1).call();
				var calcZap = await contracts.zapBondage.methods.calcZapForDots(provAddr,endptNameHex,numDots).call();
				sql1 = await "UPDATE endpoints SET zap_value="+con.escape(calcZap)+" WHERE endpoint_name=" + con.escape(endptName)+" AND provider_address=" + con.escape(provAddr);				
				sql2 = await "UPDATE endpoints SET dot_value="+con.escape(dotCost)+" WHERE endpoint_name=" + con.escape(endptName)+" AND provider_address=" + con.escape(provAddr);
				await con.query(sql1, function(err, result) {
					if (err) throw err;
				});
				await con.query(sql2, function(err, result) {
					if (err) throw err;
				});
				console.log("iteration "+i+" finished");
			}
		});

	} catch(error) {
		console.log("Error!");
		console.log(error);
	}

	
}

main();