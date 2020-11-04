
# Staking Details

Minimum Deposit: `50 OP tokens`

APR: `39%`

Reward Frequency: `24 hours`

Contract Running Time: `90 days`

Contract Maximum Holdings: `75k OP tokens`

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

`ganache-cli --mnemonic "$(./dotenv get MNEMONIC)"`

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