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
  '0xeab59cdd581e532a910b53f7396cd8fc27e49d6f', // UniSwap: OPT-USDC
];

const updateSeconds = 20;

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
  async getPrices(tokenA) {
    const response = await axios({
      url: `https://api.coingecko.com/api/v3/simple/price?ids=${tokenA}&vs_currencies=usd`,
      method: 'get',
      data: {}
    });
    return response;
  }

  async getUniSwapTotals(poolId) {
    let response = await axios({
      url: 'https://api.thegraph.com/subgraphs/name/ianlapham/uniswapv2',
      method: 'post',
      data: {
              query: `
              {
                pairHourDatas(first: 24, orderBy: hourStartUnix, orderDirection: desc, where: { pair: "${poolId}" }) {
                    id
                    hourStartUnix
                    hourlyVolumeToken0
                    hourlyVolumeToken1
                    reserveUSD
                }
              }
              `
      }
    });

    // get current timestamp
    // count back until hourStartUnix < (current - 86400)
    // for each valid entry, get the hourlyVolumeToken0 (for OPT)
    // add them all up, multiply by price.

    const totalLiquidity = parseFloat(response.data.data.pairHourDatas[0].reserveUSD);
    //console.log('totalLiquidity: ' + totalLiquidity);

    let dailyVolumeOPT = 0;
    let currentTime = (Date.now() / 1000);
    //console.log('currentTime: ' + currentTime);
    response.data.data.pairHourDatas.forEach(pairHourData => {
      if(parseFloat(pairHourData.hourStartUnix) > (currentTime - 86400)){
        dailyVolumeOPT += parseFloat(pairHourData.hourlyVolumeToken0);
      }
    });
    //console.log('dailyVolumeOPT: ' + dailyVolumeOPT);

    response = await this.getPrices('open-predict-token');
    const optPrice = parseFloat(response.data['open-predict-token']['usd']);
    //console.log('optPrice: ' + optPrice);

    const dailyVolumeUSD = (dailyVolumeOPT * optPrice);
    return [dailyVolumeUSD, totalLiquidity];
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

  async getAPRs(){
    console.log('getting apy..');
    const [usdcDailyVolume,       usdcTotalLiquidity] = await this.getUniSwapTotals(pools[0]);
    // For yield farming/harvest rewards: 1+[750/( liquidity )]] ^ 26
    console.log('volume: ' + usdcDailyVolume);
    console.log('liquidity: ' + usdcTotalLiquidity);
    const harvestAPR = ((Math.pow(1 + (750 / (usdcTotalLiquidity)), 26))-1) * 100;
    console.log('harvest APR: ' + harvestAPR);

    // For UniSwap: ((volume * (1 + 0.003)^365) / liquidity ) * 100
    const USDCAPR  = Math.round((((   usdcDailyVolume * Math.pow(1 + 0.003, 365)) / usdcTotalLiquidity    ) * 100) + harvestAPR);
    //console.log('APRs: ' + ETHAPR + ' ' + USDTAPR + ' ' + USDCAPR);

    this.pool[this.address] = {
      id: this.address,
      USDCLP: ethers.BigNumber.from('0'),
      USDCAPR: USDCAPR,
    };
  }

  async setupSubscribers() {
    const _USER: any = this.authQuery.getValue();
    const _signer: any = _USER.signer;
    this.address = await _signer.getAddress();
    console.log('address: ' + this.address);
    console.log('getting apys..');
    await this.getAPRs();

    while (true) {
      const responses = [];
      let response = await this.getUniSwap( pools[0], this.address.toLowerCase());
      responses.push(response.data.data);

      // console.log('ETH: ' +  JSON.stringify(responses[0]));
      // console.log('USDT: ' + JSON.stringify(responses[1]));
      // console.log('USDC: ' + JSON.stringify(responses[2]));

      const USDC  = (responses[0].liquidityPositions.length === 0)
                   ? 0 : parseFloat(responses[0].liquidityPositions[0].liquidityTokenBalance);

      // console.log('ETH: ' + ETH);
      // console.log('USDT: ' + USDT);
      // console.log('USDC: ' + USDC);

      this.pool[this.address] = {
        id: this.address,
        USDCLP: USDC,
        USDCAPR: this.pool[this.address].USDCAPR,
      };

      this.poolStore.upsert(this.address, this.pool[this.address]);
      await this.timeout(updateSeconds);
    }
  }
  // ***************** Subscribers ******************
}
