import { ChangeDetectorRef, Component, NgZone, OnInit, SimpleChanges } from '@angular/core';
import { AuthQuery } from '@app/services/auth-service/auth.service.query';
import { ModalController } from '@ionic/angular';
import { BehaviorSubject, Observable } from 'rxjs';
import { WalletSelectionModalComponent } from '../wallet-selection-modal/wallet-selection-modal.component';
import { WalletOptionsModalComponent } from '@components/wallet-options-modal/wallet-options-modal.component';
import { CryptoService } from '@app/services/crypto-service/crypto.service';

@Component({
  selector: 'app-app-header',
  templateUrl: './app-header.component.html',
  styleUrls: ['./app-header.component.scss'],
})
export class AppHeaderComponent implements OnInit {

  loggedIn$: Observable<boolean> = this.authQuery.select( user => !!user.wallet );
  address: string;
  network: string

  constructor(
    private cd: ChangeDetectorRef,
    private zone: NgZone,
    private crypto: CryptoService,
    public modalCtrl: ModalController,
    public authQuery: AuthQuery ) { }

    ngOnInit() {
      this.crypto.$currentNetwork.subscribe( networkName => this.network = networkName )
      this.authQuery.select( user => user.wallet ).subscribe( res => {
        this.zone.run(() => {
          this.address = res;
          this.cd.detectChanges();
        });
      });
    }

    async login() {
      try {
        const modalOpts = {
          component: WalletSelectionModalComponent,
          componentProps: {
          },
          cssClass: 'deposit-modal',
        };
        const modal: HTMLIonModalElement = await this.modalCtrl.create(modalOpts);
        await modal.present();
        const selection = await modal.onDidDismiss();
        if ( selection.data ) {
          console.log(selection.data);
          // this.address = selection.data
          // this.getTokensHeldByAddress(selection.data)
        }
      } catch (error) {
         console.log(`modal present error ${error}`);
         throw error;
      }
    }



    async options() {
      try {
        const modalOpts = {
          component: WalletOptionsModalComponent,
          componentProps: {
          },
          cssClass: 'deposit-modal',
        };
        const modal: HTMLIonModalElement = await this.modalCtrl.create(modalOpts);
        await modal.present();
        const selection = await modal.onDidDismiss();
        if ( selection.data ) {
          console.log(selection.data);
        }
      } catch (error) {
         console.log(`modal present error ${error}`);
         throw error;
      }
    }


}
