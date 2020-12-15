import { Component, OnInit } from '@angular/core';
import { NavController } from '@ionic/angular';
import { PoolQuery } from '@app/services/pool-service/pool.service.query';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-landing',
  templateUrl: './landing.page.html',
  styleUrls: ['./landing.page.scss'],
})
export class LandingPage implements OnInit {

  poolData$: Observable<any>;

  constructor(
    public navCtrl: NavController,
    public poolQuery: PoolQuery,
  ) { 
    
  }

  async ngOnInit() {
  }

  openURL(url: string ) {
    window.open(url, '_blank');
  }

  navigateStaking() {
    this.navCtrl.navigateForward(`/staking`);
  }
}