import { Component, OnInit } from '@angular/core';
import { PoolService } from '@app/services/pool-service/pool.service';
import { NavController } from '@ionic/angular';
import { PoolQuery } from '@app/services/pool-service/pool.service.query';

@Component({
  selector: 'app-staking',
  templateUrl: './staking.page.html',
  styleUrls: ['./staking.page.scss'],
})
export class StakingPage implements OnInit {

  poolData$ = this.poolQuery.selectEntity(this.poolService.address);

  constructor(
    public navCtrl: NavController,
    public poolQuery: PoolQuery,
    private poolService: PoolService
  ) { 
    this.poolData$.subscribe( poolData => {
      console.log('poolData updated:' + JSON.stringify(poolData));
    });
  }

  async ngOnInit() {
  }

  open(url: string) {
    this.navCtrl.navigateForward(`/${url}`);

  }

  goBack() {
    this.navCtrl.back();
  }

}
