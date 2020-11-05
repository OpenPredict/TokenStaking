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
            Constants['development'].periodSeconds,
            Constants['development'].depositPeriodEnd
        );
    
        Object.keys(contracts).forEach((key) => {
            console.log(key + " address: " + contracts[key].address)
        })

        console.log('Funding reward pool..')
        const rewardPoolAmount = ethers.utils.parseUnits('1000000');

        await contracts['OpenPredict'].transfer(accounts[1], rewardPoolAmount);

        console.log('Setting approval for all to contract for reward pool tokens..')
        await contracts['OpenPredict'].approve(contracts['TokenStaking'].address, ethers.constants.MaxUint256, {from: accounts[1]});
        
        console.log('Sending OP to remaining addresses..');
        // send enough OpenPredict for 100000 tokens per account
        const range = (account,index) => index >= 2;
        console.log('transfer to accounts and assert correct balances..')
        await Promise.all(accounts.filter(range).map(async (account) => {
            await contracts['OpenPredict'].transfer(account, ethers.utils.parseUnits('100000'));
        }))
    }
};