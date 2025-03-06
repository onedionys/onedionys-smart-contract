require('@nomiclabs/hardhat-ethers');
require('@nomiclabs/hardhat-waffle');
require('dotenv').config();

const process = require('process');

module.exports = {
    solidity: {
        version: '0.8.28',
        settings: {
            optimizer: {
                enabled: true,
                runs: 200,
            },
        },
    },
    networks: {
        tea: {
            url: process.env.RPC_URL_TEA,
            accounts: [process.env.PRIVATE_KEY],
            chainId: Number(process.env.CHAIN_ID_TEA),
            gas: 12000000,
            gasPrice: 20000000000,
        },
        reddio: {
            url: process.env.RPC_URL_REDDIO,
            accounts: [process.env.PRIVATE_KEY],
            chainId: Number(process.env.CHAIN_ID_REDDIO),
            gas: 12000000,
            gasPrice: 20000000000,
        },
        monad: {
            url: process.env.RPC_URL_MONAD,
            accounts: [process.env.PRIVATE_KEY],
            chainId: Number(process.env.CHAIN_ID_MONAD),
            gas: 12000000,
            gasPrice: 20000000000,
        },
    },
};
