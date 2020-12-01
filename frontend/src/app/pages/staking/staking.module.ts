import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { StakingPageRoutingModule } from './staking-routing.module';

import { StakingPage } from './staking.page';
import { SharedModule } from '@app/shared.module';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    StakingPageRoutingModule,
    SharedModule
  ],
  declarations: [StakingPage]
})
export class StakingPageModule {}
