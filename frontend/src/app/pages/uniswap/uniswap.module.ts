import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { UniswapPageRoutingModule } from './uniswap-routing.module';

import { UniswapPage } from './uniswap.page';
import { SharedModule } from '@app/shared.module';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    UniswapPageRoutingModule,
    SharedModule
  ],
  declarations: [UniswapPage]
})
export class UniswapPageModule {}
