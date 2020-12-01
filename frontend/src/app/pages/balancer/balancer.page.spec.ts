import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { IonicModule } from '@ionic/angular';

import { BalancerPage } from './balancer.page';

describe('BalancerPage', () => {
  let component: BalancerPage;
  let fixture: ComponentFixture<BalancerPage>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ BalancerPage ],
      imports: [IonicModule.forRoot()]
    }).compileComponents();

    fixture = TestBed.createComponent(BalancerPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
