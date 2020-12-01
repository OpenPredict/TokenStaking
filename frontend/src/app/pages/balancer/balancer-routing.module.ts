import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { BalancerPage } from './balancer.page';

const routes: Routes = [
  {
    path: '',
    component: BalancerPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class BalancerPageRoutingModule {}
