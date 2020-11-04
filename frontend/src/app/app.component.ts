import { Component } from '@angular/core';

import { Config, NavController, Platform } from '@ionic/angular';
import { SplashScreen } from '@ionic-native/splash-screen/ngx';
import { StatusBar } from '@ionic-native/status-bar/ngx';
import { CryptoService } from './services/crypto-service/crypto.service';
import { AuthService } from './services/auth-service/auth.service';
import { StakingService } from './services/staking-service/staking.service';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.scss']
})
export class AppComponent {
  constructor(
    private platform: Platform,
    private splashScreen: SplashScreen,
    private config: Config,
    private statusBar: StatusBar,
    public crypto: CryptoService,
    public stakingService: StakingService,
    public navCtrl: NavController,
    public _auth: AuthService,
  ) {
    this.initializeApp();
  }

  initializeApp() {

    this.crypto.netChange();

    this.platform.ready().then( async () => {

      window.ethereum.on('accountsChanged', async (accounts) => {
        if (accounts) {
          this.initialize();
        }
      });
      window.ethereum.on('networkChanged', async (networkId) => {
        window.location.reload();
      });

      this.initialize();

      this.config.set('navAnimation', null);
      this.config.set('animated', false);

      this.statusBar.styleDefault();
      this.splashScreen.hide();
    });
  }

  async initialize() {
    const wallet: any = await this.crypto.activeSigner();
    if(wallet.hasOwnProperty('wallet') && wallet.hasOwnProperty('signer')) {
      this._auth.login(wallet.wallet, wallet.signer);
      console.log(`accounts changed..... ${wallet.wallet}`)
      await this.stakingService.setupSubscribers();
      this.navCtrl.navigateForward('/landing');
    }
  }





}
