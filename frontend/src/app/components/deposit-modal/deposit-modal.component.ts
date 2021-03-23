import { Component, Input, OnInit, AfterViewInit } from '@angular/core';
import { FormBuilder, FormArray, Validators, FormControl } from '@angular/forms';
import { BaseForm } from '@app/helpers/BaseForm';
import { CustomValidators } from '@app/helpers/CustomValidators';
import { StakingService } from '@app/services/staking-service/staking.service';
import { StakingQuery } from '@app/services/staking-service/staking.service.query';
import { ModalController } from '@ionic/angular';
import { ethers } from 'ethers';
import createNumberMask from 'text-mask-addons/dist/createNumberMask';
import { TextMaskModule } from 'angular2-text-mask';

@Component({
  selector: 'app-deposit-modal',
  templateUrl: './deposit-modal.component.html',
  styleUrls: ['./deposit-modal.component.scss'],
})
export class DepositModalComponent  extends BaseForm implements OnInit {

  @Input() balance: number;
  @Input() action: number;
  @Input() maxBet: any;

  tokenMask = BaseForm.tokenMask;

  stakingData$ = this.stakingQuery.selectEntity(this.stakingService.address);

  constructor(
    private fb: FormBuilder,
    private modalCtrl: ModalController,
    private stakingQuery: StakingQuery,
    private stakingService: StakingService,
    ) {
    super();
    this.form = this.fb.group({
      amount: [null, Validators.compose([Validators.required])],
    });

    this.stakingData$.subscribe( stakingData => {
      //console.log('stakingData updated:' + JSON.stringify(stakingData));
    });
  }

  ngOnInit() { }

  ngAfterViewInit() {
    this.form.get('amount').setValidators(
      [ 
        CustomValidators.numberRange(ethers.utils.parseUnits('0.000000000000000001'),
                                     ethers.utils.parseUnits(this.maxBet.toString()))
      ]
    );
  }

  cancel() {
    this.modalCtrl.dismiss();
  }

  confirm() {
    const amount = this.form.controls['amount'].value;
    const amountToSend = amount.replace(/,/g, '');
    this.modalCtrl.dismiss( amountToSend );
  }

  parseAmount(amount: any): string {
    return (isNaN(amount)) ? '0.0' : ethers.utils.formatUnits(amount.toString());
  }

  handleMaxBet() {
    this.form.patchValue({
      amount: this.maxBet
    });
  }
}
