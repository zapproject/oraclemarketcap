const Web3 = require("web3");
const assert = require("assert");
const fs = require("fs");
const path = require("path");

const netConfig = require("./config/network");
const INFURA_URL = "https://kovan.infura.io/xeb916AFjrcttuQlezyq";
var w3 = new Web3(new Web3.providers.HttpProvider(INFURA_URL));


ZapArbiterArtifact = JSON.parse(fs.readFileSync(path.join(__dirname,'./contracts/Arbiter.json')));
ZapBondageArtifact = JSON.parse(fs.readFileSync(path.join(__dirname,'./contracts//Bondage.json')));
ZapBondageStorageArtifact = JSON.parse(fs.readFileSync(path.join(__dirname,'./contracts/BondageStorage.json')));
ZapDispatchArtifact = JSON.parse(fs.readFileSync(path.join(__dirname,'./contracts/Dispatch.json')));
ZapRegistryArtifact = JSON.parse(fs.readFileSync(path.join(__dirname,'./contracts/Registry.json')));
ZapTokenArtifact = JSON.parse(fs.readFileSync(path.join(__dirname,'./contracts/ZapToken.json')));
// Client1Artifact = JSON.parse(fs.readFileSync(path.join(__dirname,'./contracts/Client1.json')));

// TODO: need to figure out what to put in for networks

//Ideally
var netID = "development"; 

module.exports = {
    BASE: 1000000000000000000,
    web3 : w3,
    zapRegistry : new w3.eth.Contract(ZapRegistryArtifact.abi,
        "0xef341dc88d61734e31ca561af31418ec4f8f127a"),
    zapToken : new w3.eth.Contract(ZapTokenArtifact.abi,
        ZapTokenArtifact.networks["development"].address),
    zapBondage : new w3.eth.Contract(ZapBondageArtifact.abi,
        ZapBondageArtifact.networks[netConfig.netId].address),
    zapArbiter: new w3.eth.Contract(ZapArbiterArtifact.abi,
        ZapArbiterArtifact.networks[netConfig.netId].address),
    zapDispatch : new w3.eth.Contract(ZapDispatchArtifact.abi,
        ZapDispatchArtifact.networks[netConfig.netId].address),
    // Client1 : new w3.eth.Contract(Client1Artifact.abi,
    //     ZapDispatchArtifact.networks[netConfig.netId].address),
};
