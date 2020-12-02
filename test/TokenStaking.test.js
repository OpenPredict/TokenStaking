const OpenPredict = artifacts.require('OpenPredict');
const TokenStaking = artifacts.require('TokenStaking');


const assert = require("chai").assert;
const truffleAssert = require('truffle-assertions');
const { AssertionError } = require("chai");

const ethers = require("ethers");
const Utils = require('./../utils');
const Constants = Utils.Constants

// test specific constants
let creationTime = 0;
amountPerAddress = '100000';
contracts = []

async function sendTokensToAddresses(contracts, accounts) {
    // send enough OpenPredict for 100000 tokens per account
    const range = (account,index) => index >= 2;
    const amount = ethers.utils.parseUnits(amountPerAddress);
    console.log('transfer to accounts and assert correct balances..')
    await Promise.all(accounts.filter(range).map(async (account) => {
        await contracts['OpenPredict'].transfer(account, amount);
        const balance = await contracts['OpenPredict'].balanceOf(account);
        assert.equal(balance.valueOf.toString(), amount.valueOf.toString());
    }))
}

contract("TokenStaking", async (accounts) => {

    beforeEach( async () => {
        console.log('Creating contracts..')
        contracts['OpenPredict'] = await OpenPredict.new();
        creationTime = Math.floor(Date.now() / 1000);
        contracts['TokenStaking'] = await TokenStaking.new(
            contracts['OpenPredict'].address,
            accounts[1],
            Constants['test'].depositPeriodEnd,
            Constants['test'].periodSeconds
        );
    
        Object.keys(contracts).forEach((key) => {
            console.log(key + " address: " + contracts[key].address)
        })

        console.log('Funding reward pool..')
        const rewardPoolAmount = ethers.utils.parseUnits('1000000');

        await contracts['OpenPredict'].transfer(accounts[1], rewardPoolAmount);

        console.log('Setting approval for all to contract for reward pool tokens..')
        await contracts['OpenPredict'].approve(contracts['TokenStaking'].address, ethers.constants.MaxUint256, {from: accounts[1]});
        

        console.log('Sending OP to remaining addresses..')
        await sendTokensToAddresses(contracts, accounts);
    })

    it("Should pass for test case A", async () => {

        console.log('accounts[2] approves TokenStaking for 50 OP..');
        const amount = ethers.utils.parseUnits(Constants.minDeposit);
        console.log('attempt deposit without granting allowance..')
        await truffleAssert.reverts(
            contracts['TokenStaking'].deposit(amount, {from: accounts[2]}),
            "TokenStaking: call to OpenPredict token contract failed (transferFrom)"
        );

        await contracts['OpenPredict'].approve(contracts['TokenStaking'].address, amount, {from: accounts[2]});
        console.log('call deposit..');
        await contracts['TokenStaking'].deposit(amount, {from: accounts[2]});
        stakingPerAddress = await contracts['TokenStaking'].getStakingPerAddress({from: accounts[2]});
        assert.equal(stakingPerAddress[0][2], false);
        balance = await contracts['OpenPredict'].balanceOf(contracts['TokenStaking'].address);
        assert.equal(balance.valueOf().toString(), amount.valueOf().toString());

        console.log('wait for 2 periods..')
        await new Promise(r => setTimeout(r, 2 * Constants['test'].periodSeconds * 1000));

        console.log('withdraw, check balance..');
        await contracts['TokenStaking'].withdraw({from: accounts[2]});
        stakingPerAddress = await contracts['TokenStaking'].getStakingPerAddress({from: accounts[2]});
        console.log('stakingPerAddress: ' + stakingPerAddress);
        assert.equal(stakingPerAddress[0][2], true);
        newBalance = await contracts['OpenPredict'].balanceOf(accounts[2]);
        console.log('newBalance: ' + newBalance.valueOf().toString());
        // Original Balance + DPR * Constants.minDeposit * 2
        expectedBalance = ethers.utils.parseUnits(amountPerAddress).add(
            Constants.DPR.mul(
                ethers.BigNumber.from(2)).mul(
                    ethers.BigNumber.from(Constants.minDeposit)
            )
        );
        assert.equal(newBalance.valueOf().toString(), expectedBalance.valueOf().toString());

        console.log('attempt withdraw again, assert same balance as previous..');
        await contracts['TokenStaking'].withdraw({from: accounts[2]});
        sameBalance = await contracts['OpenPredict'].balanceOf(accounts[2]);
        assert.equal(expectedBalance.valueOf().toString(), sameBalance.valueOf().toString());

        console.log('accounts[2] approves TokenStaking for 1000 OP, 2 deposits, and withdraw, all valid');
        numTokens = '500';
        const newAmount = ethers.utils.parseUnits(numTokens)
        await contracts['OpenPredict'].approve(contracts['TokenStaking'].address, 
                                               newAmount.mul(ethers.BigNumber.from('2')), 
                                               {from: accounts[2]});

        await contracts['TokenStaking'].deposit(newAmount, {from: accounts[2]});
        await contracts['TokenStaking'].deposit(newAmount, {from: accounts[2]});
        stakingPerAddress = await contracts['TokenStaking'].getStakingPerAddress({from: accounts[2]});
        console.log('stakingPerAddress: ' + stakingPerAddress);
        assert.equal(stakingPerAddress[0][2], true);
        assert.equal(stakingPerAddress[1][2], false);
        assert.equal(stakingPerAddress[2][2], false);

        console.log('wait for 2 more periods..')
        await new Promise(r => setTimeout(r, Constants['test'].periodSeconds * 2 * 1000));

        await contracts['TokenStaking'].withdraw({from: accounts[2]});
        newBalance = await contracts['OpenPredict'].balanceOf(accounts[2]);
        expectedBalance = expectedBalance.add(
            Constants.DPR.mul(
                ethers.BigNumber.from(2)).mul(ethers.BigNumber.from(numTokens).mul(ethers.BigNumber.from('2'))
            )
        );
        assert.equal(newBalance.valueOf().toString(), expectedBalance.valueOf().toString());

        stakingPerAddress = await contracts['TokenStaking'].getStakingPerAddress({from: accounts[2]});
        console.log('stakingPerAddress: ' + stakingPerAddress);
        stakingPerAddress.forEach(stake => {
            assert.equal(stake[2], true);
        });

        await truffleAssert.reverts(
            contracts['TokenStaking'].deposit(1, {from: accounts[2]}),
            "TokenStaking: Amount staked must be greater than 50 OP",
        )

        console.log('pause contract from owner..')
        await contracts['TokenStaking'].pause();

        console.log('attempt deposit during pause..')
        await contracts['OpenPredict'].approve(contracts['TokenStaking'].address, amount, {from: accounts[2]});
        await truffleAssert.reverts(
            contracts['TokenStaking'].deposit(amount, {from: accounts[2]}),
            'Pausable: paused'
        );

        console.log('attempt unpause contract from non-owner..')
        await truffleAssert.reverts(
            contracts['TokenStaking'].unpause({from: accounts[3]}),
            "TokenStaking: msg.sender is not owner"
        );

        console.log('unpause contract from owner..')
        await contracts['TokenStaking'].unpause();

        console.log('attempt pause contract from non-owner..')
        await truffleAssert.reverts(
            contracts['TokenStaking'].pause({from: accounts[4]}),
            "TokenStaking: msg.sender is not owner"
        );

        console.log('attempt revoke from non-owner...')
        await truffleAssert.reverts(
            contracts['TokenStaking'].revoke({from: accounts[1]}),
            "TokenStaking: msg.sender is not owner"
        );

        console.log('revoke...')
        await contracts['TokenStaking'].revoke();

        console.log('attempt setRewardPool from non-owner...')
        await truffleAssert.reverts(
            contracts['TokenStaking'].setRewardPool(accounts[1], {from: accounts[5]}),
            "TokenStaking: msg.sender is not owner"
        );

        console.log('setRewardPool from owner...')
        await contracts['TokenStaking'].setRewardPool(accounts[1]);

        console.log('assert set...')
        const rewardPoolAddress = await contracts['TokenStaking'].getRewardPool();
        assert.equal(rewardPoolAddress, accounts[1]);

        console.log('attempt setOpenPredictToken from non-owner...')
        await truffleAssert.reverts(
            contracts['TokenStaking'].setOpenPredictToken(contracts['OpenPredict'].address, {from: accounts[5]}),
            "TokenStaking: msg.sender is not owner"
        );

        console.log('setOpenPredictToken from owner...')
        await contracts['TokenStaking'].setOpenPredictToken(contracts['OpenPredict'].address);

        console.log('assert set...')
        const openPredictTokenAddress = await contracts['TokenStaking'].getOpenPredictToken();
        assert.equal(openPredictTokenAddress, contracts['OpenPredict'].address);

        console.log('attempt withdraw on account 3 with no stakes..');
        await truffleAssert.reverts(
            contracts['TokenStaking'].withdraw({from: accounts[3]}),
            "TokenStaking: No staking epochs for address"
        );
        
        console.log('valid deposit of min token amount..')
        await contracts['TokenStaking'].deposit(ethers.utils.parseUnits(Constants.minDeposit), {from: accounts[2]}),

        console.log('attempt deposit maximum amount to contract, verify failure..');
        await truffleAssert.reverts(
            contracts['TokenStaking'].deposit(ethers.utils.parseUnits(Constants.contractLimit), {from: accounts[2]}),
            "TokenStaking: Contract balance with deposited amount exceeds deposit limit"
        );
    })

    // deposit for min amount
    // calc amount up to Constants['test'].depositPeriodEnd
    // wait for Constants['test'].depositPeriodEnd + 2 periods
    // verify deposit faulure following Constants['test'].depositPeriodEnd
    // verify correct rewards
    it("Should pass for test case B", async () => {
        console.log('Getting balance of accounts[2]..');
        const originalBalance = await contracts['OpenPredict'].balanceOf(accounts[2]);

        console.log('accounts[2] approves TokenStaking for 50 OP..');
        const amount = ethers.utils.parseUnits(Constants.minDeposit);
        await contracts['OpenPredict'].approve(contracts['TokenStaking'].address, amount, {from: accounts[2]});

        console.log('call deposit..');
        await contracts['TokenStaking'].deposit(amount, {from: accounts[2]});
        stakingPerAddress = await contracts['TokenStaking'].getStakingPerAddress({from: accounts[2]});
        const depositTime = stakingPerAddress[0][1];
        // get resulting rewards
        const periods = Math.floor((Constants['test'].depositPeriodEnd - (depositTime - creationTime)) / Constants['test'].periodSeconds);
        const rewards = Constants.DPR.mul(50).mul(periods);
        const originalBalanceWithRewards = ethers.BigNumber.from(originalBalance.valueOf().toString()).add(rewards);
        console.log('   originalBalance: ' + originalBalance.valueOf().toString());
        console.log('rewards: ' + rewards.valueOf().toString());
        console.log('originalBalanceWithRewards: ' + originalBalanceWithRewards.valueOf().toString());

        console.log('Awaiting til staking period end, plus a couple more periods..');
        await new Promise(r => setTimeout(r, (Constants['test'].depositPeriodEnd + (2 * Constants['test'].periodSeconds)) * 1000));

        console.log('attempt deposit following deposit period end, verify failure..');
        await truffleAssert.reverts(
            contracts['TokenStaking'].deposit(ethers.utils.parseUnits(Constants.minDeposit), {from: accounts[2]}),
            "TokenStaking: Deposit period ended"
        );

        console.log('Call withdraw..');
        await contracts['TokenStaking'].withdraw({from: accounts[2]});

        console.log('verify rewards do not exceed staking period end..');
        // balance following full Constants['test'].depositPeriodEnd will be:
        // originalBalance + (Constants.minDeposit(50) * DPR * maxPeriods(10))
        const balanceWithRewards = await contracts['OpenPredict'].balanceOf(accounts[2]);
        console.log('balanceWithRewards: ' + balanceWithRewards.valueOf().toString());
        assert.equal(balanceWithRewards.valueOf().toString(), originalBalanceWithRewards.valueOf().toString());
    })   
})