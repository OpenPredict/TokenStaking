import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-app-footer',
  templateUrl: './app-footer.component.html',
  styleUrls: ['./app-footer.component.scss'],
})
export class AppFooterComponent implements OnInit {
  constructor() { }

    ngOnInit() {
    }

    navigateContract() {
      //here goes for contract action
      console.log("contract")
    }

    navigateToken() {
      //here goes for token action
      console.log("token")
    }
}
