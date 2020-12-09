import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { BalancerPageRoutingModule } from './balancer-routing.module';

import { BalancerPage } from './balancer.page';
import { SharedModule } from '@app/shared.module';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    BalancerPageRoutingModule,
    SharedModule,
    MatProgressSpinnerModule
  ],
  declarations: [BalancerPage]
})
export class BalancerPageModule {}
