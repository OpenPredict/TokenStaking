import { Component, OnInit } from '@angular/core';
import { ModalController, NavController } from '@ionic/angular';
import { BaseForm } from '@app/helpers/BaseForm';
import { DepositModalComponent } from '@app/components/deposit-modal/deposit-modal.component';

@Component({
  selector: 'app-landing',
  templateUrl: 'landing.page.html',
  styleUrls: ['landing.page.scss'],
})
export class LandingPage implements OnInit {

  constructor(
    public modalCtrl: ModalController,
    public navCtrl: NavController ) {}

  ngOnInit() {}

  balanceFromMetaMask: number = 500.045 
  
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
        console.log(selection.data)
        // this.address = selection.data
        // this.getTokensHeldByAddress(selection.data)
      }
    } catch (error) {
       console.log(`modal present error ${error}`)
       throw error
    }   
  }  

}
