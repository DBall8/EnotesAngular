import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { Router } from '@angular/router';

import { LoginService } from '../services/login.service';

/* OptionsMenuComponent

Component for displaying an options menu

*/

@Component({
  selector: 'app-options-menu',
  templateUrl: './options-menu.component.html',
  styleUrls: ['./options-menu.component.css']
})
export class OptionsMenuComponent implements OnInit {

    @Input() visible: boolean;
    @Output() showAccountSettings = new EventEmitter();

  constructor(private loginService: LoginService, private router: Router) { }

    ngOnInit() {
    }

    // Log out the user
    private logout() {
        this.loginService.logout().subscribe((res) => {
            if (res.status == 200) {
                this.router.navigate(['login']);
            }
        });
    }

    // Navigate to the changelog page
    private gotoChangelog() {
        this.router.navigate(['changelog']);
    }

    // Shows the account settings window
    private showAccountSettingsWindow() {
        this.showAccountSettings.emit();
        this.visible = false;
    }

}
