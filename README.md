
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

# Development - Setup

`npm install`  

`truffle compile`

## Run Tests + Create Coverage Report

`truffle run coverage --network development`

`open coverage/index.html`

  

## Run Tests standalone

  
`ganache-cli`

`truffle test --network development`