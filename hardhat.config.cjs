require('@nomiclabs/hardhat-ethers');
require('@nomiclabs/hardhat-waffle');
require('dotenv').config();

const process = require('process');

module.exports = {
    solidity: {
        version: '0.8.27',
        settings: {
            optimizer: {
                enabled: true,
                runs: 200,
            },
        },
    },
    networks: {
        'tea-assam': {
            url: process.env.RPC_URL,
            accounts: [process.env.PRIVATE_KEY],
            chainId: Number(process.env.CHAIN_ID),
            gas: 12000000,
            gasPrice: 20000000000,
        },
    },
};
