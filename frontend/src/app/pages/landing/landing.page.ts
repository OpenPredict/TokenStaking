import { Component, OnInit } from '@angular/core';
import { ModalController, NavController } from '@ionic/angular';
import { DepositModalComponent } from '@app/components/deposit-modal/deposit-modal.component';
import { AuthQuery } from '@app/services/auth-service/auth.service.query';
import { AuthService } from '@app/services/auth-service/auth.service';
import { WalletSelectionModalComponent } from '@app/components/wallet-selection-modal/wallet-selection-modal.component';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-landing',
  templateUrl: 'landing.page.html',
  styleUrls: ['landing.page.scss'],
})
export class LandingPage implements OnInit {

  loggedIn$: Observable<boolean> = this.authQuery.select( user => !!user.wallet )  
  harvestDisabledForSomeReason: boolean = true // change this to false to enable the harvest button
  balanceFromMetaMask: number = 500.045  // this gets fed into the form modal to show the balance, retrive from wherever and populate this variable 
  
  constructor(
    public modalCtrl: ModalController,
    private auth: AuthService,
    private authQuery: AuthQuery,
    public navCtrl: NavController ) {}

  ngOnInit() {

  }

  harvest() {
    alert("Not sure what happens here in the designs")
  }
  
  async deposit() {
    try {
      const modalOpts = { 
        component: DepositModalComponent,
        componentProps: {
          balance: this.balanceFromMetaMask
        },
        cssClass: 'deposit-modal',
      }  
      let modal: HTMLIonModalElement = await this.modalCtrl.create(modalOpts);  
      await modal.present(); 
      const selection = await modal.onDidDismiss()
      if( selection.data ) {
        console.log(selection.data) // Do something with this Value i.e send it somewhere etc
      }
    } catch (error) {
       console.log(`modal present error ${error}`)
       throw error
    }   
  }  
  
  
  
  async login() {
    try {
      const modalOpts = { 
        component: WalletSelectionModalComponent,
        componentProps: {
        },
        cssClass: 'deposit-modal',
      }  
      let modal: HTMLIonModalElement = await this.modalCtrl.create(modalOpts);  
      await modal.present(); 
    } catch (error) {
       console.log(`modal present error ${error}`)
       throw error
    }   
  }   
  
  

}
