import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { OtpStakingPage } from './otp-staking.page';

const routes: Routes = [
  {
    path: '',
    component: OtpStakingPage,
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class OtpStakingPageRoutingModule {}
