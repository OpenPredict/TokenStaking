import { NgModule } from '@angular/core';
import { PreloadAllModules, RouterModule, Routes } from '@angular/router';
import { AuthGuardGuard } from './auth-guard.guard';
import { WalletGuard } from './wallet.guard';


const routes: Routes = [
  {
    path: '',
    // redirectTo: 'connect-wallet',
    redirectTo: 'staking',
    pathMatch: 'full'
  },
  {
    path: 'connect-wallet',
    loadChildren: () => import('./pages/connect-wallet/connect-wallet.module').then( m => m.ConnectWalletPageModule)
  },
  {
    path: 'otp-staking',
    canActivate : [WalletGuard],
    loadChildren: () => import('./pages/landing/landing.module').then( m => m.LandingPageModule)
  },
  {
    path: 'landing',
    loadChildren: () => import('./pages/staking/staking.module').then( m => m.StakingPageModule)
  },
  {
    path: 'uniswap',
    loadChildren: () => import('./pages/uniswap/uniswap.module').then( m => m.UniswapPageModule)
  },
  {
    path: 'balancer',
    loadChildren: () => import('./pages/balancer/balancer.module').then( m => m.BalancerPageModule)
  },
];

@NgModule({
  imports: [
    RouterModule.forRoot(routes, { preloadingStrategy: PreloadAllModules })
  ],
  exports: [RouterModule]
})
export class AppRoutingModule { }
