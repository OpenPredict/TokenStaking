import { Component, OnInit } from '@angular/core';
import { PoolService } from '@app/services/pool-service/pool.service';
import { NavController } from '@ionic/angular';
import { PoolQuery } from '@app/services/pool-service/pool.service.query';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-staking',
  templateUrl: './staking.page.html',
  styleUrls: ['./staking.page.scss'],
})
export class StakingPage implements OnInit {

  poolData$: Observable<any>;

  constructor(
    public navCtrl: NavController,
    public poolQuery: PoolQuery,
    private poolService: PoolService
  ) { 
    this.getPoolData();
  }

  getPoolData() {
    setTimeout(() => {
      if(this.poolService.address !== undefined &&  this.poolService.address !== "") {
        console.log('this.poolService.address ' + this.poolService.address)
        this.poolData$ = this.poolQuery.selectEntity(this.poolService.address);
        this.poolData$.subscribe( poolData => {
          console.log('poolData updated:' + JSON.stringify(poolData));
        });
      } else {
        this.getPoolData();
      }
    }, 500);
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
