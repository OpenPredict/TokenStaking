import { Component, OnInit } from '@angular/core';
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

@Component({
  selector: 'app-landing',
  templateUrl: 'landing.page.html',
  styleUrls: ['landing.page.scss'],
})
export class LandingPage implements OnInit {

  loggedIn$: Observable<boolean> = this.authQuery.select( user => !!user.wallet );
  stakingData$ = this.stakingQuery.selectEntity(this.stakingService.address);

  constructor(
    public modalCtrl: ModalController,
    private authQuery: AuthQuery,
    private stakingService: StakingService,
    private stakingQuery: StakingQuery,
    public navCtrl: NavController,
    public toastCtrl: ToastController,
    public ui: UiService, ) {}

  ngOnInit() {
    this.stakingData$.subscribe( res => console.log('stakingData updated:' + JSON.stringify(res)) );
  }

  // ***************** Buttons *****************
  async harvest() {
    try {
      const interaction = await this.ui
                              .loading(  this.stakingService.withdraw(),
                              'You will be prompted for 1 contract interaction, please approve to successfully harvest, and please be patient as it may take a few moments to broadcast to the network.' )
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
          balance: 0
        },
        cssClass: 'deposit-modal',
      };
      const modal: HTMLIonModalElement = await this.modalCtrl.create(modalOpts);
      await modal.present();
      const selection = await modal.onDidDismiss();
      if ( selection.data ) {
        const amount = BaseForm.transformAmount(selection.data);
        console.log('amount:' + amount); // Do something with this Value i.e send it somewhere etc

        try {
          const interaction = await this.ui
                                  .loading(  this.stakingService.deposit(amount),
                                  'You will be prompted for 2 contract interactions, please approve all to successfully stake, and please be patient as it may take a few moments to broadcast to the network.' )
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
      this.navCtrl.navigateForward('/landing');
    }, 3000);
  }
// *************** Messages *********************

// ************** helper functions ***************

  hasRewards(rewards) {
    return (isNaN(rewards)) ? false : (rewards > 0);
  }

  parseAmount(amount) {
    return (isNaN(amount)) ? 0 : parseFloat(ethers.utils.formatUnits(amount.toString())).toFixed(2);
  }

}