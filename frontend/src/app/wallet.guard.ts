import { Injectable } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot, UrlTree, Router } from '@angular/router';
import { Observable } from 'rxjs';
import { AuthQuery } from '@services/auth-service/auth.service.query';
import { CryptoService } from './services/crypto-service/crypto.service';
import { AuthService } from './services/auth-service/auth.service';
import { StakingService } from './services/staking-service/staking.service';
import { PoolService } from './services/pool-service/pool.service';

@Injectable({
  providedIn: 'root'
})
export class WalletGuard implements CanActivate {

  constructor(
    private authQry: AuthQuery,
    private router: Router,
    private cryptoService: CryptoService,
    private stakingService: StakingService,
    private poolService: PoolService,
    public _auth: AuthService) {}

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot): Observable<boolean | UrlTree> | Promise<boolean | UrlTree> | boolean | UrlTree {
      this.cryptoService.activeSigner()
      .then( wallet => {
        this._auth.login(wallet['wallet'], wallet['signer']);
        console.log(`accounts changed..... ${wallet['wallet']}`);
        this.stakingService.setupSubscribers().then(() => {
          this.poolService.setupSubscribers();
        })
       })
      .catch(error => {
        console.log('redirecting to connect wallet ');
        this.router.navigateByUrl('/connect-wallet');
      })

      return true;
  }
}
