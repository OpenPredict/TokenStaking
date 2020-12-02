import { Component, OnInit } from '@angular/core';
import { NavController } from '@ionic/angular';

@Component({
  selector: 'app-uniswap',
  templateUrl: './uniswap.page.html',
  styleUrls: ['./uniswap.page.scss'],
})
export class UniswapPage implements OnInit {

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
