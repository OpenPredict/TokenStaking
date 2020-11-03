import { Injectable } from '@angular/core';
import { IStaking } from '@app/data-model';
import { EntityState, EntityStore, MultiActiveState, StoreConfig } from '@datorama/akita';


export interface State extends EntityState<IStaking> {}

const initialState: State = {};

@Injectable({ providedIn: 'root' })
@StoreConfig({ name: 'staking', resettable: true })
export class StakingStore extends EntityStore<State, IStaking> {
  constructor() {
    super( initialState );
  }
}