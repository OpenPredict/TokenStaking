truffleConfig = require('./truffle-config')
ethers = require('ethers')

module.exports = {
    Constants: {
        'development' : {
            provider : new ethers.providers.JsonRpcProvider("http://" + truffleConfig.networks.development.host + ":" + truffleConfig.networks.development.port.toString()),
            secret: truffleConfig.networks.development.secret,
            periodSeconds : 86400,      // 1 day
            depositPeriodEnd: 7956000   // 90 days
        },
        'kovan': {
            provider : new ethers.providers.JsonRpcProvider('https://kovan.infura.io/v3/fb44167f83e740898c90737b6ec456d8'),
            secret: truffleConfig.networks.kovan.secret,
            periodSeconds : 86400,      // 1 day
            depositPeriodEnd: 7956000   // 90 days
        },
        'mainnet': {
            provider : new ethers.providers.JsonRpcProvider('https://mainnet.infura.io/v3/f97f529377f6498c8293587deb03bf9c'),
            secret: truffleConfig.networks.kovan.secret,
            periodSeconds : 86400,      // 1 day
            depositPeriodEnd: 7956000   // 90 days
        },
        'test' : {
            provider : new ethers.providers.JsonRpcProvider("http://" + truffleConfig.networks.development.host + ":" + truffleConfig.networks.development.port.toString()),
            secret: truffleConfig.networks.test.secret,
            periodSeconds : 4,
            depositPeriodEnd : 20,
        },
        minDeposit : '50',
        contractLimit : '35000',
        DPR : new ethers.BigNumber.from('85').mul(ethers.utils.parseUnits('.001')).div(new ethers.BigNumber.from('365')) // Daily Percentage Return: 8.5% (APR) / 365 (days per year) / 100 (per single token).
    },

    getNextContractAddress: function (address, nonce){
        const { toChecksumAddress } = require('ethereum-checksum-address')
        rlp = require('rlp')
        keccak = require('keccak')
        var input_arr = [ address, nonce ];
        var rlp_encoded = rlp.encode(input_arr);
        var contract_address_long = keccak('keccak256').update(rlp_encoded).digest('hex');
        var contract_address = '0x'.concat(contract_address_long.substring(24));
        return toChecksumAddress(contract_address);
    },

    getTransactionCount: async function (index) {
        signer = new ethers.Wallet.fromMnemonic(this.Constants['development'].secret, "m/44'/60'/0'/0/" + index)
        nonce = await signer.connect(this.Constants['development'].provider).getTransactionCount()
        return nonce
    }
};
