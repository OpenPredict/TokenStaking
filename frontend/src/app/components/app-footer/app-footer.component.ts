import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-app-footer',
  templateUrl: './app-footer.component.html',
  styleUrls: ['./app-footer.component.scss'],
})
export class AppFooterComponent implements OnInit {

  constructor() { }

  ngOnInit() {}

  openURL(url: string ) {
    window.open(url, '_blank');
  }
}
