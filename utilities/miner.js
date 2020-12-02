
var ethers = require('ethers');
const utils = require('./../utils.js')
let Constants = utils.Constants;

const OpenPredict  = require('./../build/contracts/OpenPredict.json');
const TokenStaking = require('./../build/contracts/TokenStaking.json');
const contracts = [];
const contractAddresses = [];
contractAddresses['OpenPredict'] = '0xe78A0F7E598Cc8b0Bb87894B0F60dD2a88d6a8Ab';
contractAddresses['TokenStaking'] = '0x5b1869D9A4C187F2EAa108f3062412ecf0526b24';

function getRandomInt(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min) + min); //The maximum is exclusive and the minimum is inclusive
}

function timeout(secs) {
    return new Promise(resolve => setTimeout(resolve, secs * 1000));
  }

async function mine() {
    wallet = new ethers.Wallet.fromMnemonic(Constants['development'].secret);
    wallet = wallet.connect(Constants['development'].provider);
    contracts['OpenPredict']  = new ethers.Contract(contractAddresses['OpenPredict'], OpenPredict.abi, wallet);
    contracts['TokenStaking'] = new ethers.Contract(contractAddresses['TokenStaking'], TokenStaking.abi, wallet);

    while(true){
        console.log('mining tx..');
        await contracts['TokenStaking'].setOpenPredictToken(contracts['OpenPredict'].address);
        console.log('done.');
        await timeout(getRandomInt(2,8)); // average 5 second block time
    }
}
mine();
