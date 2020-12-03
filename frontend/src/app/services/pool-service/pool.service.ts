import { Injectable } from '@angular/core';
import { PoolStore } from './pool.service.store';
import { map, mapTo } from 'rxjs/operators';
import { ID } from '@datorama/akita';
import { timer } from 'rxjs/internal/observable/timer';
import { ModalController, NavController, ToastController } from '@ionic/angular';
import axios from 'axios';
import { AuthQuery } from '../auth-service/auth.service.query';
import { UiService } from '../ui-service/ui.service';
import { ethers } from 'ethers';

const pools = [
  '0xe7700d9cd80517ade303048f4c55f03284a095cc', // UniSwap: OPT-ETH
  '0xc676ea0f3dd28d4207b713578ecee609ee525784', // UniSwap: OPT-USDT
  '0xd3d14de568990854705c40221f75efbad8c0c981'  // Balancer: OPT-USDC
];

const updateSeconds = 10;

export const options: any[] = [];

@Injectable({
  providedIn: 'root'
})
export class PoolService {

  pool = {};
  address = '';

  constructor(
    public modalCtrl: ModalController,
    private authQuery: AuthQuery,
    private poolStore: PoolStore,
    public navCtrl: NavController,
    public toastCtrl: ToastController,
    public ui: UiService) {}

    getPool(id: ID) {
      return timer(500).pipe(
        mapTo(Object.values(this.pool)),
        map(() => this.poolStore.add(this.pool[id]))
      );
    }

  // ***************** pool queries *****************

  async getBalancer(poolId, address) {
    // const address = this.crypto.address;
    console.log('address: ' + address);
    const response = await axios({
      url: 'https://api.thegraph.com/subgraphs/name/balancer-labs/balancer',
      method: 'post',
      data: {
              query: `
              {
                  pool (id: "${poolId}")
                  {
                      id
                      publicSwap
                      finalized
                      liquidity
                      swapFee
                      totalWeight
                      totalShares
                      totalSwapVolume
                      tokensList
                      tokens
                      {
                          id
                          address
                          balance
                          decimals
                          symbol
                          denormWeight
                      }
                      shares (orderBy: balance, orderDirection: desc, where:{id: "${poolId + '-' + address}", balance_gt:"0"})
                      {
                          id
                          userAddress {
                              id
                          }
                          balance
                      }
                  }
              }
              `
      }
      });
    return response;
  }

async getUniSwap(poolId, address) {
    const response = await axios({
      url: 'https://api.thegraph.com/subgraphs/name/ianlapham/uniswapv2',
      method: 'post',
      data: {
        query: `
            {
                liquidityPositions(where: { user: "${address}", pair: "${poolId}" }) {
                    pair {
                        id
                        reserve0
                        reserve1
                        reserveUSD
                        token0 {
                        id
                        symbol
                        derivedETH
                        }
                        token1 {
                        id
                        symbol
                        derivedETH
                        }
                        totalSupply
                    }
                    liquidityTokenBalance
                }
            }
        `
      }
    });
    return response;
  }

  // ***************** Subscribers ******************

  timeout(secs) {
    return new Promise(resolve => setTimeout(resolve, secs * 1000));
  }

  async setupSubscribers() {
    const _USER: any = this.authQuery.getValue();
    const _signer: any = _USER.signer;
    this.address = await _signer.getAddress();
    console.log('address: ' + this.address);

    this.pool[this.address] = {
      id: this.address,
      OPTUSDC: ethers.BigNumber.from('0'),
      OPTUSDT: ethers.BigNumber.from('0'),
      OPTETH: ethers.BigNumber.from('0')
    };

    while (true) {
      const responses = [];
      let response = await this.getUniSwap( pools[0], this.address);
      responses.push(response.data.data);

      response = await this.getUniSwap( pools[1], this.address);
      responses.push(response.data.data);

      response = await this.getBalancer(pools[2], this.address);
      responses.push(response.data.data);

      console.log('ETH: ' +  JSON.stringify(responses[0]));
      console.log('USDT: ' + JSON.stringify(responses[1]));
      console.log('USDC: ' + JSON.stringify(responses[2]));

      const ETH  = (responses[0].liquidityPositions.length === 0)
                   ? 0 : parseFloat(responses[0].liquidityPositions[0].liquidityTokenBalance);
      const USDT = (responses[1].liquidityPositions.length === 0)
                   ? 0 : parseFloat(responses[1].liquidityPositions[0].liquidityTokenBalance);
      const USDC = (responses[2].pool.shares.length        === 0)
                   ? 0 : parseFloat(responses[2].pool.shares[0].balance);

      console.log('ETH: ' + ETH);
      console.log('USDT: ' + USDT);
      console.log('USDC: ' + USDC);

      this.pool[this.address] = {
        id: this.address,
        OPTETH: ETH,
        OPTUSDT: USDT,
        OPTUSDC: USDC
      };
      this.poolStore.upsert(this.address, this.pool[this.address]);
      await this.timeout(updateSeconds);
    }
  }
  // ***************** Subscribers ******************
}
