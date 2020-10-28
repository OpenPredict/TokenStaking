import { Component, Input, OnInit } from '@angular/core';
import { FormBuilder, FormArray, Validators } from '@angular/forms';
import { BaseForm } from '@app/helpers/BaseForm';
import { ModalController } from '@ionic/angular';

@Component({
  selector: 'app-deposit-modal',
  templateUrl: './deposit-modal.component.html',
  styleUrls: ['./deposit-modal.component.scss'],
})
export class DepositModalComponent  extends BaseForm implements OnInit {

  @Input() balance: number;  
  @Input() action: number;    
  
  constructor(
    private fb: FormBuilder,
    private modalCtrl: ModalController,
    ) {
    super()
    this.form = this.fb.group({
      amount: [null, Validators.compose([Validators.required])],                                                               
    });     
  }

  ngOnInit() {}

  cancel() {
    this.modalCtrl.dismiss()
  }

  confirm() {
    let amount = this.form.controls['amount'].value
    this.modalCtrl.dismiss( amount ) // send this to some service/metamask
  }  
  
  
}
