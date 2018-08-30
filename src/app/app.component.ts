import { Component, OnInit } from '@angular/core';

import { Settings } from './classes/Settings';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit{
    title = 'app';

    ngOnInit() {
        Settings.init();
    }
}
