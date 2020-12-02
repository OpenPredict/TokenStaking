import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { IonicModule } from '@ionic/angular';

import { OtpStakingPage } from './otp-staking.page';

describe('OtpStakingPage', () => {
  let component: OtpStakingPage;
  let fixture: ComponentFixture<OtpStakingPage>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ OtpStakingPage ],
      imports: [IonicModule.forRoot()]
    }).compileComponents();

    fixture = TestBed.createComponent(OtpStakingPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
