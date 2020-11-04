const OpenPredict    = artifacts.require("OpenPredict");
const TokenStaking   = artifacts.require("TokenStaking");

const ethers = require('ethers')
const Utils = require('./../utils');
const Constants = Utils.Constants

module.exports = async function (deployer, network, accounts) {

    console.log("network: " + network)
    process.env.NETWORK = network
    if(network === 'development'){
        contracts= []
        console.log('Creating contracts..')
        contracts['OpenPredict'] = await OpenPredict.new();
        contracts['TokenStaking'] = await TokenStaking.new(
            contracts['OpenPredict'].address,
            accounts[1],
            Constants.periodSeconds,
            Constants.depositPeriodEnd
        );
    
        Object.keys(contracts).forEach((key) => {
            console.log(key + " address: " + contracts[key].address)
        })
    }
};