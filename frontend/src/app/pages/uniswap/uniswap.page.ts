import { Component, OnInit } from '@angular/core';
import { PoolService } from '@app/services/pool-service/pool.service';
import { PoolQuery } from '@app/services/pool-service/pool.service.query';
import { NavController } from '@ionic/angular';

@Component({
  selector: 'app-uniswap',
  templateUrl: './uniswap.page.html',
  styleUrls: ['./uniswap.page.scss'],
})
export class UniswapPage implements OnInit {
  poolData$ = this.poolQuery.selectEntity(this.poolService.address);

  constructor( public navCtrl: NavController,
               private poolQuery: PoolQuery,
               private poolService: PoolService) {

    this.poolData$.subscribe( poolData => {
      console.log('poolData updated:' + JSON.stringify(poolData));
    });
  }

  ngOnInit() {}

  openURL(url: string ) {
    window.open(url, '_blank');
  }

  addLiquidity() {
    alert(`Add some liquid....`);
  }

  goBack() {
    this.navCtrl.back();
  }

}
