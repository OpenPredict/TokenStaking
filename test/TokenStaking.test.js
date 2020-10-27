const OpenPredict = artifacts.require('OpenPredict');
const TokenStaking = artifacts.require('TokenStaking');

const assert = require("chai").assert;
const truffleAssert = require('truffle-assertions');
const { AssertionError } = require("chai");

const ethers = require("ethers");

const periodSeconds = 4;
const numPeriods = 2;
const depositPeriodEnd = 25;
const maxPeriods = depositPeriodEnd / periodSeconds;

const minDeposit = '50';
const contractLimit = '75000';
const amountPerAddress = '100000';
let creationTime = 0;

// Daily Percentage Return: 26% (APR) / 365 (days per year) / 100 (per single token).
DPR = new ethers.BigNumber.from('39').mul(ethers.utils.parseUnits('.01')).div(new ethers.BigNumber.from('365'));

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
    let contracts = []

    beforeEach( async () => {
        console.log('Creating contracts..')
        contracts['OpenPredict'] = await OpenPredict.new();
        creationTime = Math.floor(Date.now() / 1000);
        contracts['TokenStaking'] = await TokenStaking.new(
            contracts['OpenPredict'].address,
            accounts[1],
            periodSeconds,
            depositPeriodEnd
        );

        console.log('Funding reward pool..')
        const rewardPoolAmount = ethers.utils.parseUnits('1000000');
        await contracts['OpenPredict'].transfer(accounts[1], rewardPoolAmount);
        const balance = await contracts['OpenPredict'].balanceOf(accounts[1]);
        assert.equal(balance.valueOf().toString(), rewardPoolAmount.valueOf().toString());


        console.log('Setting approval for all to contract for reward pool tokens..')
        await contracts['OpenPredict'].approve(contracts['TokenStaking'].address, ethers.constants.MaxUint256, {from: accounts[1]});
        

        console.log('Sending OP to remaining addresses..')
        await sendTokensToAddresses(contracts, accounts);
    })

    it("Should pass for test case A", async () => {

        console.log('accounts[2] approves TokenStaking for 50 OP..');
        const amount = ethers.utils.parseUnits(minDeposit);
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
        await new Promise(r => setTimeout(r, periodSeconds * numPeriods * 1000));

        console.log('withdraw, check balance..');
        await contracts['TokenStaking'].withdraw({from: accounts[2]});
        stakingPerAddress = await contracts['TokenStaking'].getStakingPerAddress({from: accounts[2]});
        console.log('stakingPerAddress: ' + stakingPerAddress);
        assert.equal(stakingPerAddress[0][2], true);
        newBalance = await contracts['OpenPredict'].balanceOf(accounts[2]);
        console.log('newBalance: ' + newBalance.valueOf().toString());
        // Original Balance + DPR * minDeposit * numPeriods
        expectedBalance = ethers.utils.parseUnits(amountPerAddress).add(
            DPR.mul(
                ethers.BigNumber.from(numPeriods)).mul(ethers.BigNumber.from(minDeposit)
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
        await new Promise(r => setTimeout(r, periodSeconds * numPeriods * 1000));

        await contracts['TokenStaking'].withdraw({from: accounts[2]});
        newBalance = await contracts['OpenPredict'].balanceOf(accounts[2]);
        expectedBalance = expectedBalance.add(
            DPR.mul(
                ethers.BigNumber.from(numPeriods)).mul(ethers.BigNumber.from(numTokens).mul(ethers.BigNumber.from('2'))
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
        await contracts['TokenStaking'].deposit(ethers.utils.parseUnits(minDeposit), {from: accounts[2]}),

        console.log('attempt deposit maximum amount to contract, verify failure..');
        await truffleAssert.reverts(
            contracts['TokenStaking'].deposit(ethers.utils.parseUnits(contractLimit), {from: accounts[2]}),
            "TokenStaking: Contract balance with deposited amount exceeds deposit limit"
        );

        console.log('waiting for deposit period end..');
        await new Promise(r => setTimeout(r, (depositPeriodEnd - (periodSeconds * numPeriods * 2)) * 1000));

        console.log('attempt deposit following deposit period end, verify failure..');
        await truffleAssert.reverts(
            contracts['TokenStaking'].deposit(ethers.utils.parseUnits(minDeposit), {from: accounts[2]}),
            "TokenStaking: Deposit period ended"
        );
    })

    // deposit for min amount
    // calc amount up to depositPeriodEnd
    // wait for depositPeriodEnd + 2 periods
    // verify correct rewards
    it("Should pass for test case B", async () => {
        console.log('Getting balance of accounts[2]..');
        const originalBalance = await contracts['OpenPredict'].balanceOf(accounts[2]);

        console.log('accounts[2] approves TokenStaking for 50 OP..');
        const amount = ethers.utils.parseUnits(minDeposit);
        await contracts['OpenPredict'].approve(contracts['TokenStaking'].address, amount, {from: accounts[2]});

        console.log('call deposit..');
        await contracts['TokenStaking'].deposit(amount, {from: accounts[2]});
        stakingPerAddress = await contracts['TokenStaking'].getStakingPerAddress({from: accounts[2]});
        const depositTime = stakingPerAddress[0][1];
        // get resulting rewards
        const periods = Math.floor((depositPeriodEnd - (depositTime - creationTime)) / periodSeconds);
        const rewards = DPR.mul(50).mul(periods);
        const originalBalanceWithRewards = ethers.BigNumber.from(originalBalance.valueOf().toString()).add(rewards);
        console.log('   originalBalance: ' + originalBalance.valueOf().toString());
        console.log('rewards: ' + rewards.valueOf().toString());
        console.log('originalBalanceWithRewards: ' + originalBalanceWithRewards.valueOf().toString());

        console.log('Awaiting til staking period end, plus a couple more periods..');
        await new Promise(r => setTimeout(r, (depositPeriodEnd + (2 * periodSeconds)) * 1000));

        console.log('Call withdraw..');
        await contracts['TokenStaking'].withdraw({from: accounts[2]});

        console.log('verify rewards do not exceed staking period end..');
        // balance following full depositPeriodEnd will be:
        // originalBalance + (minDeposit(50) * DPR * maxPeriods(10))
        const balanceWithRewards = await contracts['OpenPredict'].balanceOf(accounts[2]);
        console.log('balanceWithRewards: ' + balanceWithRewards.valueOf().toString());
        assert.equal(balanceWithRewards.valueOf().toString(), originalBalanceWithRewards.valueOf().toString());
    })   
})