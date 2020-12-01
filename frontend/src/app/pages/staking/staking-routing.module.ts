import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { StakingPage } from './staking.page';

const routes: Routes = [
  {
    path: '',
    component: StakingPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class StakingPageRoutingModule {}
