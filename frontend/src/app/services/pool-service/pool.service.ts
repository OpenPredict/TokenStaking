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

const OPTAddresses = [
  '0x64a63ef1b19519be8afb9080e5725bd608d6f389' // Balancer: OPT Address
]

const updateSeconds = 20;

const ETH = 0;
const USDT = 1;
const USDC = 2;

// BAL drop APY (subject to weekly change)
const BalancerDropAPY = 15;

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
  async getPrices(tokenA, tokenB) {
    const response = await axios({
      url: `https://api.coingecko.com/api/v3/simple/price?ids=${tokenA},${tokenB}&vs_currencies=usd`,
      method: 'get',
      data: {}
    });
    return response;
  }

  async getUniSwapTotals(poolId, tokenId) {
    let response = await axios({
      url: 'https://api.thegraph.com/subgraphs/name/ianlapham/uniswapv2',
      method: 'post',
      data: {
              query: `
              {
                pairDayDatas(first: 1, orderBy: date, orderDirection: desc, where: { pairAddress: "${poolId}" }) {
                    id
                    dailyVolumeToken0
                    dailyVolumeToken1
                    dailyVolumeUSD
                    reserveUSD
                }
              }
              `
      }
    });

    const totalLiquidity = parseFloat(response.data.data.pairDayDatas[0].reserveUSD);
    //console.log('totalLiquidity: ' + totalLiquidity);

    const optVolume = parseFloat(response.data.data.pairDayDatas[0].dailyVolumeToken0);
    //console.log('optVolume: ' + optVolume);
    const tokenVolume = parseFloat(response.data.data.pairDayDatas[0].dailyVolumeToken1);
    //console.log('tokenVolume: ' + tokenVolume);

    response = await this.getPrices('open-predict-token', tokenId);
    const optPrice   = parseFloat(response.data['open-predict-token']['usd']);
    //console.log('optPrice: ' + optPrice);
    const tokenPrice = parseFloat(response.data[tokenId]['usd']);
    //console.log('tokenPrice: ' + tokenPrice);

    const dailyVolume = (optVolume * optPrice) + (tokenVolume * tokenPrice);

    //console.log('daily uniswap volume for ' + tokenId + ': ' + dailyVolume);

    return [dailyVolume, totalLiquidity];
  }

  async getBalancerTotals(poolId) {
    const response = await axios({
      url: 'https://api.thegraph.com/subgraphs/name/balancer-labs/balancer',
      method: 'post',
      data: {
        query: ` {
          pool (id: "${poolId}")
          {
            liquidity
            totalShares
            shares (where:{id: "${poolId + '-' + OPTAddresses[0]}"}) {
              balance
            }
          }
        } `
      }
    });

    // remove OPT addresses liquidity from the balancer pool
    const pool = response.data.data.pool;
    //console.log('pool: ' + JSON.stringify(pool));
    const percentageShares = parseFloat(pool.shares[0].balance) / parseFloat(pool.totalShares);
    //console.log('percentageShares: ' + percentageShares);
    const liquidity = parseFloat(pool.liquidity) - (percentageShares * parseFloat(pool.liquidity));
    //console.log('liquidity: ' + liquidity);
    return liquidity;
  }

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

  async getAPYs(){
    const [ethDailyVolume,       ethTotalLiquidity] = await this.getUniSwapTotals(pools[0], 'ethereum');
    const [tetherDailyVolume, tetherTotalLiquidity] = await this.getUniSwapTotals(pools[1], 'tether');
    const usdcTotalLiquidity = await this.getBalancerTotals(pools[2]);

    // For yield farming/harvest rewards: 1+[750/( liquidity )]] ^ 26
    console.log('liquidity: ' + ethTotalLiquidity + ' ' + tetherTotalLiquidity + ' ' + usdcTotalLiquidity);
    const harvestAPY = ((Math.pow(1 + (750 / (ethTotalLiquidity + tetherTotalLiquidity + usdcTotalLiquidity)), 26))-1) * 100;
    console.log('harvest APY: ' + harvestAPY);

    // For UniSwap: ((volume * (1 + 0.003)^365) / liquidity ) * 100
    const ETHAPY  = Math.round((((   ethDailyVolume * Math.pow(1 + 0.003, 365)) / ethTotalLiquidity    ) * 100) + harvestAPY);
    const USDTAPY = Math.round((((tetherDailyVolume * Math.pow(1 + 0.003, 365)) / tetherTotalLiquidity ) * 100) + harvestAPY);
    // For Balancer: BAL drop + harvest returns
    const USDCAPY = Math.round(BalancerDropAPY + harvestAPY);

    console.log('APYs: ' + ETHAPY + ' ' + USDTAPY + ' ' + USDCAPY);

    this.pool[this.address] = {
      id: this.address,
      ETHLP: ethers.BigNumber.from('0'),
      USDTLP: ethers.BigNumber.from('0'),
      USDCLP: ethers.BigNumber.from('0'),
      ETHAPY: ETHAPY,
      USDTAPY: USDTAPY,
      USDCAPY: USDCAPY,
    };
  }

  async setupSubscribers() {
    const _USER: any = this.authQuery.getValue();
    const _signer: any = _USER.signer;
    this.address = await _signer.getAddress();
    console.log('address: ' + this.address);
    await this.getAPYs();

    while (true) {
      const responses = [];
      let response = await this.getUniSwap( pools[0], this.address);
      responses.push(response.data.data);

      response = await this.getUniSwap( pools[1], this.address);
      responses.push(response.data.data);

      response = await this.getBalancer(pools[2], this.address);
      responses.push(response.data.data);

      //console.log('ETH: ' +  JSON.stringify(responses[0]));
      //console.log('USDT: ' + JSON.stringify(responses[1]));
      //console.log('USDC: ' + JSON.stringify(responses[2]));

      const ETH  = (responses[0].liquidityPositions.length === 0)
                   ? 0 : parseFloat(responses[0].liquidityPositions[0].liquidityTokenBalance);
      const USDT = (responses[1].liquidityPositions.length === 0)
                   ? 0 : parseFloat(responses[1].liquidityPositions[0].liquidityTokenBalance);
      const USDC = (responses[2].pool.shares.length        === 0)
                   ? 0 : parseFloat(responses[2].pool.shares[0].balance);

      //console.log('ETH: ' + ETH);
      //console.log('USDT: ' + USDT);
      //console.log('USDC: ' + USDC);

      this.pool[this.address] = {
        id: this.address,
        ETHLP: ETH,
        USDTLP: USDT,
        USDCLP: USDC,
        ETHAPY: this.pool[this.address].ETHAPY,
        USDTAPY: this.pool[this.address].USDTAPY,
        USDCAPY: this.pool[this.address].USDCAPY,
      };

      this.poolStore.upsert(this.address, this.pool[this.address]);
      await this.timeout(updateSeconds);
    }
  }
  // ***************** Subscribers ******************
}
