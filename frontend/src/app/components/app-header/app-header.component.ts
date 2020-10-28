import { Component, OnInit } from '@angular/core';
import { AuthQuery } from '@app/services/auth-service/auth.service.query';
import { ModalController, NavController } from '@ionic/angular';
import { Observable } from 'rxjs';
import { WalletSelectionModalComponent } from '../wallet-selection-modal/wallet-selection-modal.component';
import { WalletOptionsModalComponent } from "@components/wallet-options-modal/wallet-options-modal.component";


@Component({
  selector: 'app-app-header',
  templateUrl: './app-header.component.html',
  styleUrls: ['./app-header.component.scss'],
})
export class AppHeaderComponent {

  loggedIn$: Observable<boolean> = this.authQuery.select( user => !!user.wallet )

  constructor(
    public modalCtrl: ModalController,
    public authQuery: AuthQuery ) { }

    
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
    
    
    
    async options() {
      try {
        const modalOpts = { 
          component: WalletOptionsModalComponent,
          componentProps: {
          },
          cssClass: 'deposit-modal',
        }  
        let modal: HTMLIonModalElement = await this.modalCtrl.create(modalOpts);  
        await modal.present(); 
        const selection = await modal.onDidDismiss()
        if( selection.data ) {
          console.log(selection.data)
        }
      } catch (error) {
         console.log(`modal present error ${error}`)
         throw error
      }   
    }     
    

}
