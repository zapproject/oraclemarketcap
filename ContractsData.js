const web3 = require("web3");
const assert = require("assert");
const fs = require("fs");
const path = require("path");

const netConfig = require("./config/network");

const w3 = new web3(netConfig.host);
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
        ZapRegistryArtifact.networks[netConfig.netId].address),
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
