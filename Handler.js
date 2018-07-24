const contracts = require("./ContractsData");
const assert = require("assert");
var Web3 = require("web3");
var web3 = new Web3(new Web3.providers.HttpProvider("http://localhost:9545"));
var redis = require('redis');
var client = redis.createClient();
//can also customize port and ip: var client = redis.createClient(port, host);

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
		client.on('connect', function() {
			console.log('Redis client connected');
		})
		client.on('error', function(err) {
			console.log('Something went wrong ' + err);
		});
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

		// var initProv = await contracts.zapRegistry.methods.initiateProvider(54321, title, spec1, params).send({from: accounts[4], gas: 6000000});
		// var initProvCurve = await contracts.zapRegistry.methods.initiateProviderCurve(spec1, constants, parts, dividers).send({from: accounts[4], gas: 6000000});
		// var initProvCurve = await contracts.zapRegistry.methods.initiateProviderCurve(spec2, constants, parts, dividers).send({from: accounts[4], gas: 6000000});
		// var initProvCurve = await contracts.zapRegistry.methods.initiateProviderCurve(spec3, constants, parts, dividers).send({from: accounts[4], gas: 6000000});


		// var regEvent1 = await getMostRecentRegistryEvent("NewProvider");
		// var regEvent2 = await getMostRecentRegistryEvent("NewCurve");
		var regEvent1 = await contracts.zapRegistry.getPastEvents("NewProvider", {fromBlock:0, toBlock:'latest'});
		var allEvents = [];
		for (let i in regEvent1) {
			// var prov = regEvent1[i].returnValues.provider;
			// var title = regEvent1[i].returnValues.title;
			// var endpt = regEvent1[i].returnValues.endpoint;
			allEvents.push(regEvent1[i].returnValues);
		}
		
		console.log(allEvents);
		// var regEvent2 = await contracts.zapRegistry.getPastEvents("NewCurve", {fromBlock:0, toBlock:'latest'});
		// console.log(regEvent1);
		// console.log(regEvent2);

	} catch(error) {
		console.log("Error!");
		console.log(error);
	}

	
}

DoThings();