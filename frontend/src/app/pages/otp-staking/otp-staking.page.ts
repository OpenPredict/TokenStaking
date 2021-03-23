import { Component, OnInit, ChangeDetectionStrategy, OnDestroy } from '@angular/core';
import { ModalController, NavController, ToastController } from '@ionic/angular';
import { DepositModalComponent } from '@app/components/deposit-modal/deposit-modal.component';
import { AuthQuery } from '@app/services/auth-service/auth.service.query';
import { AuthService } from '@app/services/auth-service/auth.service';
import { WalletSelectionModalComponent } from '@app/components/wallet-selection-modal/wallet-selection-modal.component';
import { Observable } from 'rxjs';
import { UiService } from '@app/services/ui-service/ui.service';
import { StakingService } from '@app/services/staking-service/staking.service';
import { StakingQuery } from '@app/services/staking-service/staking.service.query';
import { IStaking } from '@app/data-model';
import { ethers } from 'ethers';
import { BaseForm } from '@app/helpers/BaseForm';
import moment from "moment";
import { UnstakeModalComponent } from '@app/components/unstake-modal/unstake-modal.component';

@Component({
  selector: 'app-otp-staking',
  templateUrl: 'otp-staking.page.html',
  styleUrls: ['otp-staking.page.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class OtpStakingPage implements OnInit {

  loggedIn$: Observable<boolean> = this.authQuery.select( user => !!user.wallet );
  stakingData$ = this.stakingQuery.select();
  maxBet: any;
  interval: any;
  loadTimeReward: boolean = false;

  constructor(
    public modalCtrl: ModalController,
    private authQuery: AuthQuery,
    private stakingService: StakingService,
    private stakingQuery: StakingQuery,
    public navCtrl: NavController,
    public toastCtrl: ToastController,
    public ui: UiService, ) {}

  ngOnInit() {
    this.stakingData$.subscribe( stakingData => {
      let remainingInContract = 100000 - +this.getContractBalance(stakingData, false);
      let walletBalance = +this.getWalletBalance(stakingData, false);
      let walletBalanceAsString = this.getWalletBalanceAsString(stakingData);
      this.maxBet = (remainingInContract < walletBalance) ? remainingInContract.toString() : walletBalanceAsString;

      if(this.stakingService.timeToRewardsStart > 0){
        const label = document.getElementById('rewardStatus_label');
        label.innerHTML = "Time Until Rewards Start";
        this.initializeTime('rewardStatus_value', this.stakingService.timeToRewardsStart);
      }else if(this.stakingService.timeToRewardsEnd > 0){
        const label = document.getElementById('rewardStatus_label');
        label.innerHTML = "Time Left In Reward Pool";
        this.initializeTime('rewardStatus_value', this.stakingService.timeToRewardsEnd);
      }
    });


  }

  ngOnDestroy() {
    clearInterval(this.interval);
  }

  initializeTime(id, endtime) {
    const interval = 1000;
    setTimeout(() => {
      if(endtime !== undefined && endtime != "") {
        const secondsSpan = document.getElementById(id);
        let timeLeft = endtime;
        this.interval = setInterval(() => {
          if(endtime > 0) {
            timeLeft--;
            if(timeLeft < 0){
              return;
            }
            this.loadTimeReward = true;
            let duration = moment.duration((timeLeft).toString(), "seconds");
            let d = Math.floor(moment.duration(duration).asDays());
            let h = moment.duration(duration).hours();
            let m = moment.duration(duration).minutes();
            let s = moment.duration(duration).seconds();
            secondsSpan.innerHTML = `${d}d ${h}h ${m}m ${s}s`;
          } else {
            clearInterval(this.interval);
          }
        }, interval)
      } else {
        //this.initializeTime(id, this.stakingService.timeToRewardsStart);
      }
    }, 500);
  }

  // ***************** Buttons *****************
  async harvest() {
    try {
      const interaction = await this.ui
                              .loading(  this.stakingService.withdraw(0),
                              'You will be prompted for contract interactions, please approve to successfully harvest, and please be patient as it may take a few moments to broadcast to the network.' )
                              .catch( e => alert(`Error with contract interactions ${JSON.stringify(e)}`) );
      if (interaction) {
          this.showContractCallSuccess('Success! Your winnings have been harvested.');
       }
     } catch (error) {
       alert(`Error ! ${error}`);
     }
  }

  async stake() {
    try {
      const modalOpts = {
        component: DepositModalComponent,
        componentProps: {
          balance: 0,
          maxBet: this.maxBet
        },
        cssClass: 'deposit-modal',
      };
      const modal: HTMLIonModalElement = await this.modalCtrl.create(modalOpts);
      await modal.present();
      const selection = await modal.onDidDismiss();
      console.log(selection)
      if ( selection.data ) {
        // const amount = BaseForm.transformAmount(selection.data);
        const amount = selection.data;
        console.log('amount:' + amount); // Do something with this Value i.e send it somewhere etc

        try {
          const interaction = await this.ui
                                  .loading(  this.stakingService.deposit(amount),
                                  'You will be prompted for contract interactions, please approve all to successfully stake, and please be patient as it may take a few moments to broadcast to the network.' )
                                  .catch( e => alert(`Error with contract interactions ${JSON.stringify(e)}`) );
          if (interaction) {
              this.showContractCallSuccess('Success! Your stake has been placed.');
           }
         } catch (error) {
           alert(`Error ! ${error}`);
         }

      }
    } catch (error) {
       console.log(`modal present error ${error}`);
       throw error;
    }
  }

  async unstake() {
    try {
      const modalOpts = {
        component: UnstakeModalComponent,
        componentProps: {
          balance: 0,
        },
        cssClass: 'deposit-modal',
      };
      const modal: HTMLIonModalElement = await this.modalCtrl.create(modalOpts);
      await modal.present();
      const selection = await modal.onDidDismiss();
      console.log(selection)
      if ( selection.data ) {
        // const amount = BaseForm.transformAmount(selection.data);
        const amount = selection.data;
        console.log('amount:' + amount); // Do something with this Value i.e send it somewhere etc

        try {
          const interaction = await this.ui
                                  .loading(  this.stakingService.withdraw(amount),
                                  'You will be prompted for contract interactions, please approve all to successfully stake, and please be patient as it may take a few moments to broadcast to the network.' )
                                  .catch( e => alert(`Error with contract interactions ${JSON.stringify(e)}`) );
          if (interaction) {
              this.showContractCallSuccess('Success! Your stake has been placed.');
           }
         } catch (error) {
           alert(`Error ! ${error}`);
         }

      }
    } catch (error) {
       console.log(`modal present error ${error}`);
       throw error;
    }
  }

  async login() {
    try {
      const modalOpts = {
        component: WalletSelectionModalComponent,
        componentProps: {
        },
        cssClass: 'deposit-modal',
      };
      let modal: HTMLIonModalElement = await this.modalCtrl.create(modalOpts);
      await modal.present();
    } catch (error) {
       console.log(`modal present error ${error}`);
       throw error;
    }
  }
// ***************** Buttons *****************

  // *************** Messages *********************
  async showContractCallSuccess(messageArg: string) {
    const toast = await this.toastCtrl.create({
      position: 'middle',
      duration: 2000,
      cssClass: 'successToast',
      message: messageArg,
    });
    await toast.present();
    setTimeout( async () => {
      await toast.dismiss();
    }, 3000);
  }
// *************** Messages *********************

// ************** helper functions ***************
  getStaked(stakingData, fix){
    return stakingData.entities[this.stakingService.address] !== undefined
      ? this.parseAmount(stakingData.entities[this.stakingService.address].staked, fix)
      : 0.0;
  }

  getRewards(stakingData, fix){
    return stakingData.entities[this.stakingService.address] !== undefined
      ? this.parseAmount(stakingData.entities[this.stakingService.address].rewards, fix)
      : 0.0;
  }

  getContractBalance(stakingData, fix){
    return stakingData.entities[this.stakingService.address] !== undefined
      ? this.parseAmount(stakingData.entities[this.stakingService.address].ContractBalance, fix)
      : 0.0;
  }

  getWalletBalance(stakingData, fix){
    return stakingData.entities[this.stakingService.address] !== undefined
      ? this.parseAmount(stakingData.entities[this.stakingService.address].WalletBalance, fix)
      : 0.0;
  }

  getWalletBalanceAsString(stakingData){
    return stakingData.entities[this.stakingService.address] !== undefined
      ? ethers.utils.formatUnits(stakingData.entities[this.stakingService.address].WalletBalance.toString())
      : 0.0;
  }

  hasBalance(balance) {
    return (isNaN(balance)) ? false : (balance > 0);
  }

  parseAmount(amount, fix) {
    const parsed = (isNaN(amount)) ? 0 : parseFloat(ethers.utils.formatUnits(amount.toString()));
    return (fix) ? parsed.toFixed(2) : parsed;
  }

  goBack() {
    this.navCtrl.back();
  }      
}
