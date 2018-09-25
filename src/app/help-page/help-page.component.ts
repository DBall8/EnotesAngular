import { Component, OnInit } from '@angular/core';
import { Location } from '@angular/common';

/**
    Component for displaying a page showing simple instructions for the app
*/

@Component({
  selector: 'app-help-page',
  templateUrl: './help-page.component.html',
  styleUrls: ['./help-page.component.css']
})
export class HelpPageComponent implements OnInit {

  constructor(public location: Location) { }

  ngOnInit() {
  }

}
