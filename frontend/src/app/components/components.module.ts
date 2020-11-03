import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { PipesModule } from '@pipes/pipes.module';
import {RouterModule} from '@angular/router';
import { ConnectWallet } from '@components/connect-wallet/connect-wallet.component';
import { AppHeaderComponent } from '@components/app-header/app-header.component';
import { DepositModalComponent } from '@components/deposit-modal/deposit-modal.component';
import { WalletSelectionModalComponent } from '@components/wallet-selection-modal/wallet-selection-modal.component';
import { WalletOptionsModalComponent } from '@components/wallet-options-modal/wallet-options-modal.component';
import { TextMaskModule } from 'angular2-text-mask';

const components = [
  ConnectWallet,
  AppHeaderComponent,
  DepositModalComponent,
  WalletSelectionModalComponent,
  WalletOptionsModalComponent,
]

@NgModule({
  imports: [
    CommonModule,
    IonicModule,
    PipesModule,
    FormsModule,
    ReactiveFormsModule,
    RouterModule,
    TextMaskModule,
  ],
  providers: [],
  declarations: components,
  entryComponents: components,
  exports: components
})
export class ComponentsModule {}
