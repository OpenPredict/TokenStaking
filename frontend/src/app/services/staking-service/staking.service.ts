import { Injectable } from '@angular/core';
import { StakingStore } from './staking.service.store';
import { map, mapTo, tap } from 'rxjs/operators';
import { ID, cacheable } from '@datorama/akita';
import { Observable } from 'rxjs';
import { timer } from 'rxjs/internal/observable/timer';
import { ModalController, NavController, ToastController } from '@ionic/angular';
import { CryptoService } from '../crypto-service/crypto.service';
import { AuthQuery } from '../auth-service/auth.service.query';
import { UiService } from '../ui-service/ui.service';
import { ethers } from 'ethers';

const OpenPredict  = require('@truffle/build/contracts/OpenPredict.json');
const Farm = require('@truffle/build/contracts/Farm.json');
const contractAddresses = [];

export const options: any[] = [];

@Injectable({
  providedIn: 'root'
})
export class StakingService {

  staking = {};
  rewardPeriodSeconds = 86400;

  ethAvgBlockTime = 13.5;

  balanceUpdates = {}; // stores Ids of new deposit events, to prevent the same event affecting state.

  address = '';
  contracts = [];
  public timeToRewardsStart: any;
  public timeToRewardsEnd: any;

  constructor(
    public modalCtrl: ModalController,
    private crypto: CryptoService,
    private authQuery: AuthQuery,
    private stakingStore: StakingStore,
    public navCtrl: NavController,
    public toastCtrl: ToastController,
    public ui: UiService) {
      this.crypto.$currentNetwork.subscribe( (networkName) => {
        console.log('network: ' + networkName);
        if (networkName === 'homestead'){ // mainnet
          contractAddresses['OpenPredict']  = '0x4fe5851c9af07df9e5ad8217afae1ea72737ebda';
          contractAddresses['Farm'] = '0x33a48a75d4bBf189B96fe17a72B8AE2162a60203';
        }
        if (networkName === 'kovan'){
          contractAddresses['OpenPredict']  = '0x44c55E45956503c7C097b622Cd21e209161C8e63';
          contractAddresses['Farm'] = '0x9c16EfFE9aF5Fd06dE88C3fC6517CFbBe1A6C10e';
        }
        if (networkName === 'unknown'){ // localhost
          contractAddresses['OpenPredict'] = '0xe78A0F7E598Cc8b0Bb87894B0F60dD2a88d6a8Ab';
          contractAddresses['Farm']        = '0x5b1869D9A4C187F2EAa108f3062412ecf0526b24';
        }
      });
    }

    get(): Observable<void> {
      const request = timer(500).pipe(
        mapTo(Object.values(this.staking)),
        map(response => this.stakingStore.set(response))
      );

      return cacheable(this.stakingStore, request);
    }

    getStaking(id: ID) {
      return timer(500).pipe(
        mapTo(Object.values(this.staking)),
        map(() => this.stakingStore.add(this.staking[id]))
      );
    }

  // ***************** Subscribers ******************

  async setupBalanceSubscriber(){
    // First get OPT wallet balance, then subscribe to changes to balance on-chain.
    const walletBalanceRaw = await this.contracts['OpenPredict'].balanceOf(this.address);

    let poolInfo = await this.contracts['Farm'].poolInfo(0);
    const contractBalanceRaw = poolInfo[4];

    let userInfo = await this.contracts['Farm'].userInfo(0, this.address);
    let staked = userInfo[0];

    console.log('walletBalanceRaw: ' + walletBalanceRaw.toString());
    console.log('contractBalanceRaw: ' + contractBalanceRaw.toString());

    this.staking[this.address] = {
      id: this.address,
      WalletBalance: ethers.BigNumber.from(walletBalanceRaw),
      ContractBalance: ethers.BigNumber.from(contractBalanceRaw),
      staked: staked,
      rewards: this.staking[this.address].rewards,
    };
    this.stakingStore.upsert(this.address, this.staking[this.address]);

    const abi = new ethers.utils.Interface([
      'event Transfer(address,address,uint256)'
    ]);

    this.crypto.provider().on( {
        address: this.contracts['OpenPredict'].address,
        topics: [
            ethers.utils.id('Transfer(address,address,uint256)'),
          ],
      }, async (log) => {
        console.log(log);
        const from = ethers.utils.getAddress('0x' + log['topics'][1].substring(26));
        const to   = ethers.utils.getAddress('0x' + log['topics'][2].substring(26));

        console.log('from: ' + from);
        console.log('to: ' + to);

        // Check wallet balance change
        if (from === this.address ||
            to === this.address ||
            from === contractAddresses['Farm'] ||
            to === contractAddresses['Farm']) {

          const amount = ethers.BigNumber.from(log['data']);
          console.log('amount: ' + amount);
          // Unique identifier for log
          const id = log['transactionHash'].concat(log['logIndex']);
          console.log('id: ' + id);
          let currentWalletBalance = this.staking[this.address].WalletBalance;
          let currentContractBalance = this.staking[this.address].ContractBalance;

          if (!(id in this.balanceUpdates)){
            this.balanceUpdates[id] = true;
            if (to === this.address) {
              console.log('Wallet Balance add - to wallet address from: ' + from);
              currentWalletBalance = currentWalletBalance.add(amount);
            }
            if (from === this.address) {
              console.log('Wallet Balance sub - from wallet address to: ' + to);
              currentWalletBalance = currentWalletBalance.sub(amount);
            }
            let poolInfo = await this.contracts['Farm'].poolInfo(0);
            currentContractBalance = poolInfo[4];
            console.log('currentContractBalance: ' + currentContractBalance.toString());

            let userInfo = await this.contracts['Farm'].userInfo(0, this.address);
            let staked = userInfo[0];
            console.log('staked: ' + staked.toString());

            this.staking[this.address] = {
              id: this.address,
              WalletBalance: currentWalletBalance,
              ContractBalance: currentContractBalance,
              staked: staked,
              rewards: this.staking[this.address].rewards
            };
            this.stakingStore.upsert(this.address, this.staking[this.address]);
            console.log('wallet balance: ' + currentWalletBalance.valueOf().toString());
            console.log('contract balance: ' + currentContractBalance.valueOf().toString());
          }
        }
      });
  }

  async setupPendingSubscriber(){

    const _USER: any = this.authQuery.getValue();
    const _wallet: any = _USER.wallet;
    const _signer: any = _USER.signer;
    this.address = await _signer.getAddress();
    console.log('address: ' + this.address);
    this.contracts['Farm'] = new ethers.Contract(contractAddresses['Farm'], Farm.abi, _signer);

    this.crypto.provider().on("block", async (currentBlock) => {
        // Update staked amount
        let pending = await this.contracts['Farm'].pending(0, this.address);
        this.staking[this.address] = {
          id: this.address,
          WalletBalance: this.staking[this.address].WalletBalance,
          ContractBalance: this.staking[this.address].ContractBalance,
          staked: this.staking[this.address].staked,
          rewards: pending,
        };
        this.stakingStore.upsert(this.address, this.staking[this.address]);
    });
  }

  async setupSubscribers(){
    const _USER: any = this.authQuery.getValue();
    const _wallet: any = _USER.wallet;
    const _signer: any = _USER.signer;
    this.address = await _signer.getAddress();
    console.log('address: ' + this.address);
    this.contracts['OpenPredict'] = new ethers.Contract(contractAddresses['OpenPredict'], OpenPredict.abi, _signer);
    this.contracts['Farm'] = new ethers.Contract(contractAddresses['Farm'], Farm.abi, _signer);

    console.log('OpenPredict address: ' + this.contracts['OpenPredict'].address);
    console.log('Farm address: ' + this.contracts['Farm'].address);

    this.staking[this.address] = {
      id: this.address,
      WalletBalance: ethers.BigNumber.from('0'),
      ContractBalance: ethers.BigNumber.from('0'),
      staked: ethers.BigNumber.from('0'),
      rewards: ethers.BigNumber.from('0'),
    };

    // get time to start block and time to end block.
    let currentBlock = await this.crypto.provider().getBlockNumber();
    let startBlock = await this.contracts['Farm'].startBlock();
    let endBlock = await this.contracts['Farm'].endBlock();

    this.timeToRewardsStart = (currentBlock > startBlock) ? 0 : (startBlock-currentBlock) * this.ethAvgBlockTime;
    this.timeToRewardsEnd   = (currentBlock >   endBlock) ? 0 :   (endBlock-currentBlock) * this.ethAvgBlockTime;

    console.log('timeToRewardsStart: ' + this.timeToRewardsStart);
    console.log('timeToRewardsEnd: ' + this.timeToRewardsEnd);

    this.setupPendingSubscriber();
    this.setupBalanceSubscriber();
  }
  // ***************** Subscribers ******************

  // ***************** Contract Calls *****************
  async deposit(amount: any){

    return new Promise( async (resolve, reject) => {

      const _USER: any       = this.authQuery.getValue();
      const _wallet: any = _USER.wallet;
      const _signer: any = _USER.signer;
      if (!_wallet || !_signer) {
        reject(
          new Error(`Please log in via Metamask!`)
        );
      }

      const contracts = [];
      contracts['Farm'] = new ethers.Contract(contractAddresses['Farm'], Farm.abi, _signer);
      contracts['OpenPredict'] = new ethers.Contract(contractAddresses['OpenPredict'], OpenPredict.abi, _signer);
      const parsedAmount = ethers.utils.parseUnits(amount.toString());
      console.log('parsedAmount: ' + parsedAmount);

      try {
        const optionsOP = {};
        let allowance = await contracts['OpenPredict'].allowance(this.address, contractAddresses['Farm']);
        allowance = ethers.BigNumber.from(allowance);
        console.log('allowance: ' + allowance);
        if(allowance.gte(parsedAmount)){
            console.log(`Placing deposit with | amount: ${amount}`);
            const depositTS = contracts['Farm'].deposit(0, parsedAmount);
            const waitForDeposit = Promise.all([depositTS]);
            waitForDeposit.then( async (res) => {
              const depositTSWait = await res[0].wait();
              if (depositTSWait.status === 1) {
                resolve(true);
              }
            }).catch( err =>
              reject(
                `Error during transaction creation: ${JSON.stringify(err)}`
              )
          );
        }else {
          // approval not granted, approve for the difference.
          const approveOP = contracts['OpenPredict'].approve(contractAddresses['Farm'], parsedAmount.sub(allowance), optionsOP );
          const waitForApproval = Promise.all([approveOP]);
          waitForApproval.then( async (res) => {
          const approveOPWait = await res[0].wait();
          if (approveOPWait.status === 1) {
            console.log(`Placing deposit with | amount: ${amount}`);
                const depositTS = contracts['Farm'].deposit(0, parsedAmount);
                const waitForDeposit = Promise.all([depositTS]);
                waitForDeposit.then( async (res) => {
                const depositTSWait = await res[0].wait();
            if (depositTSWait.status === 1) {
                resolve(true);
              }
            }).catch( err =>
              reject(
                `Error during transaction creation: ${JSON.stringify(err)}`
              )
            );
          }
          }).catch( err =>
            reject(
              `Error during transaction creation: ${JSON.stringify(err)}`
            )
          );
        }
      } catch (error) {
        console.log();
        reject(
          new Error(error)
        );
      }
      });
    }

    async withdraw(amount: any){
      return new Promise( async (resolve, reject) => {

        const _USER: any       = this.authQuery.getValue();
        const _wallet: any = _USER.wallet;
        const _signer: any = _USER.signer;
        if (!_wallet || !_signer) {
          reject(
            new Error(`Please log in via Metamask!`)
          );
        }

        const contracts = [];
        contracts['Farm'] = new ethers.Contract(contractAddresses['Farm'], Farm.abi, _signer);

        try {
          const withdrawTS = contracts['Farm'].withdraw(0, amount);
          const waitForDeposit = Promise.all([withdrawTS]);
          waitForDeposit.then( async (res) => {
            const withdrawTSWait = await res[0].wait();
            if (withdrawTSWait.status === 1) {
              resolve(true);
            }
          }).catch( err =>
            reject(
              `Error during transaction creation: ${JSON.stringify(err)}`
            )
          );
        } catch (error) {
          console.log();
          reject(
            new Error(error)
          );
        }
      });
    }
  // ***************** Contract Calls *****************
}
