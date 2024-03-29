import { NgModule } from '@angular/core';
import { PreloadAllModules, RouterModule, Routes } from '@angular/router';
import { AuthGuardGuard } from './auth-guard.guard';
import { WalletGuard } from './wallet.guard';


const routes: Routes = [
  {
    path: '',
    redirectTo: 'landing',
    pathMatch: 'full'
  },
  {
    path: 'connect-wallet',
    loadChildren: () => import('./pages/connect-wallet/connect-wallet.module').then( m => m.ConnectWalletPageModule)
  },
  {
    path: 'landing',
    loadChildren: () => import('./pages/landing/landing.module').then( m => m.LandingPageModule)
  },
  {
    path: 'staking',
    loadChildren: () => import('./pages/staking/staking.module').then( m => m.StakingPageModule)
  },
  {
    path: 'opt',
    canActivate : [WalletGuard],
    loadChildren: () => import('./pages/otp-staking/otp-staking.module').then( m => m.OtpStakingPageModule)
  },
  {
    path: 'uniswap',
    loadChildren: () => import('./pages/uniswap/uniswap.module').then( m => m.UniswapPageModule)
  },
];

@NgModule({
  imports: [
    RouterModule.forRoot(routes, { preloadingStrategy: PreloadAllModules })
  ],
  exports: [RouterModule]
})
export class AppRoutingModule { }
