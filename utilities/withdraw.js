var ethers = require('ethers');
const utils = require('./../utils.js')
let Constants = utils.Constants;

const TokenStaking = require('./../build/contracts/TokenStaking.json');
const contracts = [];
const contractAddresses = [];
contractAddresses['TokenStaking'] = '0x4C6f9E62b4EDB743608757D9D5F16B0B67B41285';

address = '1';

async function withdraw() {
    wallet = new ethers.Wallet.fromMnemonic(Constants['development'].secret, "m/44'/60'/0'/0/" + address);
    wallet = wallet.connect(Constants['development'].provider);
    contracts['TokenStaking'] = new ethers.Contract(contractAddresses['TokenStaking'], TokenStaking.abi, wallet);

    while(true){
        console.log('withdrawing rewards..');
        const result = await contracts['TokenStaking'].withdraw({gasLimit: 1000000});
        console.log('result: ' + JSON.stringify(result));
    }
}
withdraw();
