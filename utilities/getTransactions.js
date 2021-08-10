var ethers = require('ethers');
const TokenStaking = require('./../build/contracts/TokenStaking.json');
const contracts = [];
const contractAddresses = [];
contractAddresses['TokenStaking'] = '0x33a48a75d4bBf189B96fe17a72B8AE2162a60203';
const etherscanKey = "ENTER_KEY";

async function getUserHoldings() {    
    provider = new ethers.providers.EtherscanProvider("homestead", etherscanKey);
    history = await provider.getHistory(contractAddresses['TokenStaking']);
    iface = new ethers.utils.Interface(TokenStaking.abi);
    contracts['TokenStaking'] = new ethers.Contract(contractAddresses['TokenStaking'], TokenStaking.abi, provider);
    
    depositors = {}
    history.forEach(async (tx, index) => {
        if(index !== 0){ 
            const parsed = iface.parseTransaction(tx); 
            if(parsed.name !== undefined &&  parsed.name === 'deposit'){
                let holdings = await contracts['TokenStaking'].callStatic.getHoldings({from: tx.from})
                if(!(holdings[0].toString()==='0' && holdings[1].toString()==='0')){
                    staked = ethers.utils.formatUnits(holdings[0].toString())
                    rewards = ethers.utils.formatUnits(holdings[1].toString())
                    let deposited = {'staked': staked, 'rewards': rewards};
                    depositors[tx.from] = deposited;
                }
            }
        }
    }) 
    console.log(depositors);
}
getUserHoldings();
