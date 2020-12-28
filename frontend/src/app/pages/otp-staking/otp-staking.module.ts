import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { FormsModule } from '@angular/forms';
import { OtpStakingPage } from './otp-staking.page';

import { OtpStakingPageRoutingModule } from './otp-staking-routing.module';
import { SharedModule } from '@app/shared.module';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    OtpStakingPageRoutingModule,
    SharedModule,
    MatProgressSpinnerModule
  ],
  declarations: [OtpStakingPage]
})
export class OtpStakingPageModule {}
