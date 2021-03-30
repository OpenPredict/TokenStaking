const OpenPredict = artifacts.require("OpenPredict");
const Farm        = artifacts.require("Farm");

const ethers = require('ethers')
const Utils = require('./../utils');
const Constants = Utils.Constants

module.exports = async function (deployer, network, accounts) {

    console.log("network: " + network)
    process.env.NETWORK = network
    // if(network === 'development'){
    //     contracts= []
    //     console.log('Creating contracts..')
    //     contracts['OpenPredict'] = await OpenPredict.new();
    //     contracts['TokenStaking'] = await TokenStaking.new(
    //         contracts['OpenPredict'].address,
    //         accounts[1],
    //         Constants['development'].depositPeriodEnd,
    //         Constants['development'].periodSeconds
    //     );
    
    //     Object.keys(contracts).forEach((key) => {
    //         console.log(key + " address: " + contracts[key].address)
    //     })

    //     console.log('Funding reward pool..')
    //     const rewardPoolAmount = ethers.utils.parseUnits('1000000');

    //     await contracts['OpenPredict'].transfer(accounts[1], rewardPoolAmount);

    //     console.log('Setting approval for all to contract for reward pool tokens..')
    //     await contracts['OpenPredict'].approve(contracts['TokenStaking'].address, ethers.constants.MaxUint256, {from: accounts[1]});
        
    //     console.log('Sending OP to remaining addresses..');
    //     // send enough OpenPredict for 100000 tokens per account
    //     const range = (account,index) => index >= 2;
    //     console.log('transfer to accounts and assert correct balances..')
    //     await Promise.all(accounts.filter(range).map(async (account) => {
    //         await contracts['OpenPredict'].transfer(account, ethers.utils.parseUnits('100000'));
    //     }))
    // }

    if(network == 'development') {
        contracts= []        
        console.log('deploying OPT..');
        contracts['OPT'] = await OpenPredict.new();
        
        let currentBlock = await web3.eth.getBlockNumber();
        console.log('currentBlock: ' + currentBlock);
        currentBlock += 20;
        console.log('startBlock: ' + currentBlock);
        console.log('deploying YIELD Farm..');
        contracts['OPTFarm'] = await Farm.new(contracts['OPT'].address, ethers.utils.parseUnits('0.009293978685'), currentBlock);

        console.log('approving OPT..');
        await contracts['OPT'].approve(contracts['OPTFarm'].address, ethers.utils.parseUnits('11000'));
        console.log('Funding OPT in Farm..');
        await contracts['OPTFarm'].fund(ethers.utils.parseUnits('11000'));
        console.log('adding OPT as staking token..');
        await contracts['OPTFarm'].add(1, contracts['OPT'].address, false);

        Object.keys(contracts).forEach((key) => {
            console.log(key + " address: " + contracts[key].address)
        })

        await contracts['OPT'].approve(contracts['OPTFarm'].address, ethers.utils.parseUnits('18785.167390412779722093'));

        // add stakers to new contract
        await contracts['OPTFarm'].addStakes(
            0,
            [
                '0x5492497FF50C87Db638E546331CAB20635FA253b',
                '0xc114Cfb2c4d72203C3df2683509A2C276a515652',
                '0x64A46D2643150E4e1dC2989826869b91e5e84f83',
                '0x3F86a3993c330dae0193b6081D49B32Fb21090b8',
                '0xF5b6c9f11D347E7b2F3Ddd64262A967Cb56f6531',
                '0x2713c8b6F937F91D538BC6E2c64745f7Cb908827',
                '0xf96D09c553db50EF8198eED965dF9E660133C23A',
                '0x59a603Ac2A4C1ba94DDd83a3b9FB1907FD96Ee8b',
                '0xb5237b667142fA0BC186dE1A2bB4Bf99b7Fbe8Dd',
                '0x10f822b3F879Fc7b7525776F2709a002Bd87E57c',
                '0x37b8EF2DA4964886F16c6B14fC87a5C8c9ac4038',
                '0x277c74f45724945b2066F305fcb5a609312390E2',
                '0xD8895C04CB7d43Ed16d83268d91cf946fffA4254',
                '0x39Ec78441269FC5245bC73688E32BDB9BD2abA19',
                '0xa7f6C2FE24EFcb8EB86425D4b6028e4750A9E1a5',
                '0x68575571E75D2CfA4222e0F8E7053F056EB91d6C',
                '0xD2DdB0e1c223A873c77EE80497E9D82C1002e483',
                '0x04b67AD7035C9E8C7Fc1491BCB580082B1e84107',
                '0x098850d7C5E3e42de90D1b2D9254bA01a6068405',
                '0x41A881D9217F240A70eF2aA7C68e99744be21Da1'
            ],
            [
                ethers.utils.parseUnits('2001.44'),
                ethers.utils.parseUnits('1000.0'),
                ethers.utils.parseUnits('4198.883405691978983176'),
                ethers.utils.parseUnits('1000.0'),
                ethers.utils.parseUnits('818.394027036130133098'),
                ethers.utils.parseUnits('337.8986306135848'),
                ethers.utils.parseUnits('1500.0'),
                ethers.utils.parseUnits('213.67047383337385'),
                ethers.utils.parseUnits('250.0'),
                ethers.utils.parseUnits('67.52'),
                ethers.utils.parseUnits('51.0'),
                ethers.utils.parseUnits('1000.0'),
                ethers.utils.parseUnits('620.0'),
                ethers.utils.parseUnits('2006.096'),
                ethers.utils.parseUnits('2000.0'),
                ethers.utils.parseUnits('61.0'),
                ethers.utils.parseUnits('438.956193712353515027'),
                ethers.utils.parseUnits('113.39'),
                ethers.utils.parseUnits('50.0'),
                ethers.utils.parseUnits('1056.918659525358440792'),
            ]
        )

        await contracts['OPTFarm'].increaseMaxStakeAmount(ethers.utils.parseUnits('100000'));
        await contracts['OPTFarm'].revoke(0);

    }
};