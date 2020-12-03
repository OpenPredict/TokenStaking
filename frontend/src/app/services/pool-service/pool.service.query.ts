import { Injectable } from '@angular/core';
import { Query, QueryConfig, QueryEntity } from '@datorama/akita';
import { PoolStore, State } from './pool.service.store';
import { ILPTokens } from '@app/data-model';

@Injectable({ providedIn: 'root' })
export class PoolQuery extends QueryEntity<State, ILPTokens> {
  constructor(protected store: PoolStore) {
    super(store);
  }

  clearState() {
    this.store.remove();
  }

  getPool(term: string) {
    return this.selectAll({
      filterBy: entity => entity.id == term
    });
  }
}
