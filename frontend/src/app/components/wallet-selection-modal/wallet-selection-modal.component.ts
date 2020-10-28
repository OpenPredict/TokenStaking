import { Component, OnInit } from '@angular/core';
import { AuthService } from '@app/services/auth-service/auth.service';
import { AuthQuery } from '@app/services/auth-service/auth.service.query';
import { CryptoService } from '@app/services/crypto-service/crypto.service';
import { ModalController } from '@ionic/angular';

@Component({
  selector: 'app-wallet-selection-modal',
  templateUrl: './wallet-selection-modal.component.html',
  styleUrls: ['./wallet-selection-modal.component.scss'],
})
export class WalletSelectionModalComponent implements OnInit {

  constructor(
    public crypto: CryptoService,
    private auth: AuthService,
    public modalCtrl: ModalController,
    private authQry: AuthQuery
     ) { }

  ngOnInit() {}
  
  async openMetamask() {
    this.auth.logout();
    const wallet: any = await this.crypto.activeSigner();
    if(wallet && wallet.hasOwnProperty('wallet') && wallet.hasOwnProperty('signer')) {
      this.auth.login(wallet.wallet, wallet.signer);
    }
    this.modalCtrl.dismiss()
  }

 

}
