import { Injectable } from '@angular/core';
import { ILPTokens } from '@app/data-model';
import { EntityState, EntityStore, MultiActiveState, StoreConfig } from '@datorama/akita';


export interface State extends EntityState<ILPTokens> {}

const initialState: State = {};

@Injectable({ providedIn: 'root' })
@StoreConfig({ name: 'pool', resettable: true })
export class PoolStore extends EntityStore<State, ILPTokens> {
  constructor() {
    super( initialState );
  }
};