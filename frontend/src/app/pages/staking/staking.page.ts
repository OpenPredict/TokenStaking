import { Component, OnInit } from '@angular/core';
import { NavController } from '@ionic/angular';

@Component({
  selector: 'app-staking',
  templateUrl: './staking.page.html',
  styleUrls: ['./staking.page.scss'],
})
export class StakingPage implements OnInit {

  constructor(
    public navCtrl: NavController
  ) { }

  ngOnInit() {
  }

  open(url: string) {
    this.navCtrl.navigateForward(`/${url}`);

  }

  goBack() {
    this.navCtrl.back();
  }

}
