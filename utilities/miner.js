
var ethers = require('ethers');
var Web3 = require('web3');
web3 = new Web3(new Web3.providers.HttpProvider("http://localhost:8545"));


function getRandomInt(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min) + min); //The maximum is exclusive and the minimum is inclusive
}

function sendRpc(method, params) {
    return new Promise((resolve) => {
        this.web3.currentProvider.send({
            jsonrpc: '2.0',
            method,
            params: params || [],
            id: new Date().getTime(),
        }, (err, res) => { resolve(res); });
    });
}

function timeout(secs) {
    return new Promise(resolve => setTimeout(resolve, secs * 1000));
  }

async function mine() {
    while(true){
        await sendRpc("evm_mine");
        console.log('done.');
        //await timeout(getRandomInt(2,8)); // average 5 second block time
        await timeout(2); // average 5 second block time
    }
}
mine();
