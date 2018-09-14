import { Component, OnInit } from '@angular/core';
import { Location } from '@angular/common';

@Component({
  selector: 'app-help-page',
  templateUrl: './help-page.component.html',
  styleUrls: ['./help-page.component.css']
})
export class HelpPageComponent implements OnInit {

  constructor(private location: Location) { }

  ngOnInit() {
  }

}
