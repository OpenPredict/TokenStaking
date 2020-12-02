import { Component, OnInit } from '@angular/core';
import { NavController } from '@ionic/angular';

@Component({
  selector: 'app-balancer',
  templateUrl: './balancer.page.html',
  styleUrls: ['./balancer.page.scss'],
})
export class BalancerPage implements OnInit {

  constructor( public navCtrl: NavController ) { }

  ngOnInit() {}

  openURL(url : string ) {
    window.open(url, '_blank');
  }
  
  addLiquidity() {
    alert(`Add some liquid....`)
  }

  goBack() {
    this.navCtrl.back();
  }  
  
}
