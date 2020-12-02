import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { FormsModule } from '@angular/forms';
import { OtpStakingPage } from './otp-staking.page';

import { OtpStakingPageRoutingModule } from './otp-staking-routing.module';
import { SharedModule } from '@app/shared.module';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    OtpStakingPageRoutingModule,
    SharedModule,
  ],
  declarations: [OtpStakingPage]
})
export class OtpStakingPageModule {}
