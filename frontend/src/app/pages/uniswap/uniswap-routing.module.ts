import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { UniswapPage } from './uniswap.page';

const routes: Routes = [
  {
    path: '',
    component: UniswapPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class UniswapPageRoutingModule {}
