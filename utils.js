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
        'test' : {
            provider : new ethers.providers.JsonRpcProvider("http://" + truffleConfig.networks.development.host + ":" + truffleConfig.networks.development.port.toString()),
            secret: truffleConfig.networks.development.secret,
            periodSeconds : 4,
            depositPeriodEnd : 20,
        },
        minDeposit : '50',
        contractLimit : '75000',
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
