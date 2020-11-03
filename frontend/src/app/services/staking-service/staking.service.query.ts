import { Injectable } from '@angular/core';
import { Query, QueryConfig, QueryEntity } from '@datorama/akita';
import { StakingStore, State } from './staking.service.store';
import { IStaking } from '@app/data-model';

@Injectable({ providedIn: 'root' })
export class StakingQuery extends QueryEntity<State, IStaking> {
  constructor(protected store: StakingStore) {
    super(store);
  }

  clearState() {
    this.store.remove();
  }

  getStaking(term: string) {
    return this.selectAll({
      filterBy: entity => entity.id == term
    });
  }
}
