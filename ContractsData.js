const Web3 = require("web3");
const assert = require("assert");
const fs = require("fs");
const path = require("path");

const INFURA_URL = "https://kovan.infura.io/xeb916AFjrcttuQlezyq";
var w3 = new Web3(new Web3.providers.HttpProvider(INFURA_URL));


ZapRegistryArtifact = JSON.parse(fs.readFileSync(path.join(__dirname,'./contracts/Registry.json')));

//Ideally
var netID = "development"; 

module.exports = {
    BASE: 1000000000000000000,
    web3 : w3,
    zapRegistry : new w3.eth.Contract(ZapRegistryArtifact.abi,
        "0xef341dc88d61734e31ca561af31418ec4f8f127a")
};
