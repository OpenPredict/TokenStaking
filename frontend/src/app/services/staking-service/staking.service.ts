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
const TokenStaking = require('@truffle/build/contracts/TokenStaking.json');
const contractAddresses = [];

export const options: any[] = [];

@Injectable({
  providedIn: 'root'
})
export class StakingService {

  staking = {};
  rewardPeriodSeconds = 86400;

  balanceUpdates = {}; // stores Ids of new deposit events, to prevent the same event affecting state.

  address = '';
  contracts = [];
  public timeToReward: any;

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
          contractAddresses['TokenStaking'] = '0x33a48a75d4bBf189B96fe17a72B8AE2162a60203';
        }
        if (networkName === 'kovan'){
          contractAddresses['OpenPredict']  = '0x44c55E45956503c7C097b622Cd21e209161C8e63';
          contractAddresses['TokenStaking'] = '0x9c16EfFE9aF5Fd06dE88C3fC6517CFbBe1A6C10e';
        }
        if (networkName === 'unknown'){ // localhost
          contractAddresses['OpenPredict']  = '0xe78A0F7E598Cc8b0Bb87894B0F60dD2a88d6a8Ab';
          contractAddresses['TokenStaking'] = '0x5b1869D9A4C187F2EAa108f3062412ecf0526b24';
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
    const contractBalanceRaw = await this.contracts['OpenPredict'].balanceOf(contractAddresses['TokenStaking']);

    console.log('walletBalanceRaw: ' + walletBalanceRaw.toString());
    console.log('contractBalanceRaw: ' + contractBalanceRaw.toString());

    this.staking[this.address] = {
      id: this.address,
      WalletBalance: ethers.BigNumber.from(walletBalanceRaw),
      ContractBalance: ethers.BigNumber.from(contractBalanceRaw),
      staked: this.staking[this.address].staked,
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
            from === contractAddresses['TokenStaking'] ||
            to === contractAddresses['TokenStaking']) {

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
            if (to === contractAddresses['TokenStaking']) {
              console.log('Contract Balance add - to contract address from: ' + from);
              currentContractBalance = currentContractBalance.add(amount);
            }
            if (from === contractAddresses['TokenStaking']) {
              console.log('Contract Balance sub - from contract address to: ' + to);
              currentContractBalance = currentContractBalance.sub(amount);
            }
            this.staking[this.address] = {
              id: this.address,
              WalletBalance: currentWalletBalance,
              ContractBalance: currentContractBalance,
              staked: this.staking[this.address].staked,
              rewards: this.staking[this.address].rewards
            };
            this.stakingStore.upsert(this.address, this.staking[this.address]);
            console.log('wallet balance: ' + currentWalletBalance.valueOf().toString());
            console.log('contract balance: ' + currentContractBalance.valueOf().toString());
          }
        }
      });
  }

  async setupHoldingsSubscriber(){
    // create timeout to update holdings every period
    this.updateHoldingsEveryPeriod();

    const abi = new ethers.utils.Interface([
      'event Deposit(address,uint256)'
    ]);

    this.crypto.provider().on( {
        address: this.contracts['TokenStaking'].address,
        topics: [
            ethers.utils.id('Deposit(address,uint256)'),
          ],
      }, async (log) => {
        const events = abi.parseLog(log);
        const sender = events['args'][0];
        console.log('sender: ' + sender);
        if (sender === this.address) {
          // Unique identifier for log
          const id = log['transactionHash'].concat(log['logIndex']);
          console.log('id: ' + id);
          if (!(id in this.balanceUpdates) && this.address in this.staking){
            this.balanceUpdates[id] = true;
            const amount = ethers.BigNumber.from(events['args'][1]);
            console.log('staked: ' + this.staking[this.address].staked);
            // Update staked amount
            this.staking[this.address] = {
              id: this.address,
              WalletBalance: this.staking[this.address].WalletBalance,
              ContractBalance: this.staking[this.address].ContractBalance,
              staked: this.staking[this.address].staked.add(amount),
              rewards: this.staking[this.address].rewards
            };
            this.stakingStore.upsert(this.address, this.staking[this.address]);
          }
        }
      });
  }

  timeout(secs) {
    return new Promise(resolve => setTimeout(resolve, secs * 1000));
  }

  async completePeriod(depositPeriodStart){
      // We must also account for the offset of the block arriving with the timestamp that changes to the new period.
      // so we wait for that block here.
      let nextPeriodsPassed = 0;
      const currentTime = Math.floor(Date.now() / 1000);
      const currentPeriodsPassed = Math.floor((currentTime - depositPeriodStart) / this.rewardPeriodSeconds);
      // console.log('currentTime: ' + currentTime);
      // console.log('depositPeriodStart: ' + depositPeriodStart);
      // console.log('currentPeriodsPassed: ' + currentPeriodsPassed);
      do {
        const currentBlock = await this.crypto.provider().getBlock(this.crypto.provider().getBlockNumber());
        const timestamp = currentBlock['timestamp'];

        // calc days
        nextPeriodsPassed = Math.floor((timestamp - depositPeriodStart) / this.rewardPeriodSeconds);

        // console.log('timestamp: ' + timestamp);
        // console.log('index: ' + currentBlock['number'].toString());
        // console.log('currentPeriodsPassed: ' + currentPeriodsPassed);
        // console.log('nextPeriodsPassed: ' + nextPeriodsPassed);
        await this.timeout(1);
      }while (currentPeriodsPassed !== nextPeriodsPassed);
  }

  async updateHoldingsEveryPeriod() {
    // set a timer to update the status following depositPeriodEnd. timer restarts every period.
    console.log('Entering updateHoldingsEveryPeriod..');
    const depositPeriodStartRaw = await this.contracts['TokenStaking'].getDepositPeriodStart();
    const depositPeriodStart = parseInt(depositPeriodStartRaw.toString());

    while (true){
      console.log('New period..');
      // Update the holdings from the chain at every timer restart.
      const holdingsRaw = await this.contracts['TokenStaking'].getHoldings();
      console.log('holdingsRaw: ' + holdingsRaw);
      this.staking[this.address] = {
        id: this.address,
        WalletBalance: this.staking[this.address].WalletBalance,
        ContractBalance: this.staking[this.address].ContractBalance,
        staked: ethers.BigNumber.from(holdingsRaw[0]),
        rewards: ethers.BigNumber.from(holdingsRaw[1]),
      };
      this.stakingStore.upsert(this.address, this.staking[this.address]);

      // wait for time to reward change (rewardPeriodSeconds - (current time % depositPeriodStart))
      const currentTime = Math.floor(Date.now() / 1000);
      // gives us a value in the range of 0...this.rewardPeriodSecond) that is the remaining seconds to the next period.
      const timeToRewardChange = this.rewardPeriodSeconds - ((currentTime % depositPeriodStart) % this.rewardPeriodSeconds);
      this.timeToReward = timeToRewardChange;
      console.log('timeToRewardChange: ' + timeToRewardChange);
      console.log('waiting..');
      await this.timeout(timeToRewardChange);
      this.completePeriod(depositPeriodStart);
    }
 }

  async setupSubscribers(){
    const _USER: any = this.authQuery.getValue();
    const _wallet: any = _USER.wallet;
    const _signer: any = _USER.signer;
    this.address = await _signer.getAddress();
    console.log('address: ' + this.address);
    this.contracts['OpenPredict'] = new ethers.Contract(contractAddresses['OpenPredict'], OpenPredict.abi, _signer);
    this.contracts['TokenStaking'] = new ethers.Contract(contractAddresses['TokenStaking'], TokenStaking.abi, _signer);

    console.log('OpenPredict address: ' + this.contracts['OpenPredict'].address);
    console.log('TokenStaking address: ' + this.contracts['TokenStaking'].address);

    const depositPeriodStartRaw = await this.contracts['TokenStaking'].getDepositPeriodStart();

    this.staking[this.address] = {
      id: this.address,
      WalletBalance: ethers.BigNumber.from('0'),
      ContractBalance: ethers.BigNumber.from('0'),
      staked: ethers.BigNumber.from('0'),
      rewards: ethers.BigNumber.from('0'),
    };

    this.setupHoldingsSubscriber();
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
      contracts['TokenStaking'] = new ethers.Contract(contractAddresses['TokenStaking'], TokenStaking.abi, _signer);
      contracts['OpenPredict'] = new ethers.Contract(contractAddresses['OpenPredict'], OpenPredict.abi, _signer);
      const parsedAmount = ethers.utils.parseUnits(amount.toString());

      try {
        const optionsOP = {};
        const approveOP = contracts['OpenPredict'].approve(contractAddresses['TokenStaking'],
                                                          parsedAmount,
                                                          optionsOP );

        const waitForApproval = Promise.all([approveOP]);
        waitForApproval.then( async (res) => {
          const approveOPWait = await res[0].wait();
          if (approveOPWait.status === 1) {
            console.log(`Placing deposit with | amount: ${amount}`);
            const depositTS = contracts['TokenStaking'].deposit(parsedAmount);
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
      } catch (error) {
        console.log();
        reject(
          new Error(error)
        );
      }
      });
    }

    async withdraw(){
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
        contracts['TokenStaking'] = new ethers.Contract(contractAddresses['TokenStaking'], TokenStaking.abi, _signer);

        try {
          const withdrawTS = contracts['TokenStaking'].withdraw();
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
