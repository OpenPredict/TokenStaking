import { ID } from '@datorama/akita';
import { BigNumber, ethers } from 'ethers';

export enum Token {
  IO = 0,
  O = 1
}
export enum Side {
  Lower = 0,
  Higher = 1
}
export enum Position {
  Right = 0,
  Left = 1
}
export enum Status {
  Staking = 0,
  Expired = 1,
  Active  = 2,
  Settled = 3
}

export interface LedgerWallet {
    publicKey: string;
    address: string;
}

export interface IStaking {
  id?: ID;
  WalletBalance?: ethers.BigNumber;
  ContractBalance?: ethers.BigNumber;
  staked?: ethers.BigNumber;
  rewards?: ethers.BigNumber;
}
