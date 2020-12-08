import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { StakingPageRoutingModule } from './staking-routing.module';

import { StakingPage } from './staking.page';
import { SharedModule } from '@app/shared.module';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    StakingPageRoutingModule,
    SharedModule,
    MatProgressSpinnerModule
  ],
  declarations: [StakingPage]
})
export class StakingPageModule {}
