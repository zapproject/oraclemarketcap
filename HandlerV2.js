const contracts = require("./ContractsData");
const assert = require("assert");
const Web3 = require('web3');
const {ZapRegistry} = require('@zapjs/registry');

const INFURA_URL = "https://kovan.infura.io/xeb916AFjrcttuQlezyq"
var registry = new ZapRegistry({networkId: 42, networkProvider: new Web3.providers.HttpProvider(INFURA_URL)});

registry.getProviderTitle("0x014a87cc7954dd50a566a791e4975abaa49f8745")
.then(title => console.log(title));

// zap.getNextProvider(0)
// .then(provider => {
// 	console.log(provider);
// })
// .catch((err) => {
// 	console.error(err);
// })