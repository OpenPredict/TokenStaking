import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { IonicModule } from '@ionic/angular';

import { UniswapPage } from './uniswap.page';

describe('UniswapPage', () => {
  let component: UniswapPage;
  let fixture: ComponentFixture<UniswapPage>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ UniswapPage ],
      imports: [IonicModule.forRoot()]
    }).compileComponents();

    fixture = TestBed.createComponent(UniswapPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
