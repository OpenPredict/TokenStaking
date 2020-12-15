
# Staking Details

Minimum Deposit: `50 OP tokens`

APY: `8.5%`

Reward Frequency: `24 hours`

Contract Running Time: `90 days`

Contract Maximum Holdings: `35k OP tokens`

Contract Address: https://etherscan.io/address/0x33a48a75d4bBf189B96fe17a72B8AE2162a60203#code

# Contract Interface

## function deposit (uint amount)

Transfer from msg.sender to the staking contract. allowance must have been granted before.

## function withdraw ()

Withdraw initial deposit(s), plus any staking rewards.

# Development

`npm install`  

`truffle compile`

## Local app

### Run blockchain

`ganache-cli --mnemonic -d`

### Migrate contracts

`truffle migrate --network development`

### Run miner

`node utilities/miner.js`

### Run app

`cd frontend && npm i && npm run dev`

## Run Tests + Create Coverage Report

### Create coverage report

`truffle run coverage --network development`

### Open coverage report

`open coverage/index.html`


## Run Tests standalone

### Run blockchain

`ganache-cli`

### Run tests

`truffle test --network test`