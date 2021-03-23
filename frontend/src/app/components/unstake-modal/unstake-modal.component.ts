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
  selector: 'app-unstake-modal',
  templateUrl: './unstake-modal.component.html',
  styleUrls: ['./unstake-modal.component.scss'],
})
export class UnstakeModalComponent  extends BaseForm implements OnInit {

  @Input() balance: number;

  tokenMask = BaseForm.tokenMask;

  totalStaked : any;

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
      console.log('stakingData updated:' + JSON.stringify(stakingData));
      this.totalStaked = ethers.utils.formatUnits(stakingData.staked.toString());
      this.form.get('amount').setValidators(
        [ 
          CustomValidators.numberRange(ethers.utils.parseUnits('50'),
                                       ethers.utils.parseUnits(this.totalStaked.toString()))
        ]
      );
    });
  }

  ngOnInit() { }

  // ngAfterViewInit() {

  // }

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

  handleMax() {
    this.form.patchValue({
      amount: this.totalStaked
    });
  }
}
