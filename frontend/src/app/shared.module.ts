import { NgModule } from '@angular/core';
import { CommonModule, CurrencyPipe, DecimalPipe } from '@angular/common';
import { IonicModule } from '@ionic/angular';
// import { TranslateModule} from "@ngx-translate/core"
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { PipesModule } from '@pipes/pipes.module';
import { ComponentsModule } from '@components/components.module';
import { TextMaskModule } from 'angular2-text-mask';

@NgModule({
  imports: [
    CommonModule,
    IonicModule,
    PipesModule,
    FormsModule,
    ReactiveFormsModule,
    ComponentsModule,
    TextMaskModule
  ],
  providers: [CurrencyPipe, DecimalPipe],
  declarations: [],
  entryComponents: [],
  exports: [
    CommonModule,
    IonicModule,
    PipesModule,
    FormsModule,
    ReactiveFormsModule,
    ComponentsModule,
    TextMaskModule
  ]
})
export class SharedModule {}
