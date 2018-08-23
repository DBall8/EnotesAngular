import { Component, OnInit } from '@angular/core';
import { Location } from '@angular/common';

import { Logs } from './log';

/* Changelog

Component for displaying the patch notes for the application

*/



@Component({
  selector: 'app-changelog',
  templateUrl: './changelog.component.html',
  styleUrls: ['./changelog.component.css']
})
export class ChangelogComponent implements OnInit {

    logs = [];

  constructor(private location: Location) { }

    ngOnInit() {
        this.logs = Logs;
    }

    goBack() {
        this.location.back();
    }

}
