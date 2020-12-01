import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { IonicModule } from '@ionic/angular';

import { StakingPage } from './staking.page';

describe('StakingPage', () => {
  let component: StakingPage;
  let fixture: ComponentFixture<StakingPage>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ StakingPage ],
      imports: [IonicModule.forRoot()]
    }).compileComponents();

    fixture = TestBed.createComponent(StakingPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
