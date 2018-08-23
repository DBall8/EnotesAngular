import { Component, OnInit, Input, Output, EventEmitter, ElementRef, ViewChild } from '@angular/core';

import { LoginService } from '../services/login.service';


@Component({
  selector: 'app-account-settings-page',
  templateUrl: './account-settings-page.component.html',
  styleUrls: ['./account-settings-page.component.css']
})
export class AccountSettingsPageComponent implements OnInit {

    @Input() display: boolean;
    @Output() displayChange = new EventEmitter();

    @ViewChild("OldPassword") oldPassword: ElementRef;
    @ViewChild("NewPassword") newPassword: ElementRef;
    @ViewChild("ConfirmPassword") confirmPassword: ElementRef;

    errorText: String = "";

  constructor(private loginService: LoginService) { }

  ngOnInit() {
  }

    onType() {
        if (this.errorText) {
            this.errorText = "";
        }
    }

    close() {
        this.clearFields();
        this.errorText = "";
        this.display = false;
        this.displayChange.emit(false);
    }

    updatePassword() {

        var oldPassword: String = this.oldPassword.nativeElement.value;
        var newPassword: String = this.newPassword.nativeElement.value;
        var confirmPassword: String = this.confirmPassword.nativeElement.value;

        if (!oldPassword) {
            this.errorText = "Please enter your old password.";
            return;
        }
        if (!newPassword) {
            this.errorText = "Please enter your new password.";
            return;
        }
        if (!confirmPassword) {
            this.errorText = "Please confirm your new password.";
            return;
        }

        if (confirmPassword !== newPassword) {
            this.errorText = "Error: new passwords do not match.";
            return;
        }

        this.loginService.changePassword(oldPassword, newPassword).subscribe((res: any) => {
            if (res.status != 200) {
                this.errorText = "Failed to update password. Please try again later.";
            }
            else if (res.body.successful) {
                this.errorText = "Successfully updated your password!";
                this.clearFields();
            }
            else {
                this.errorText = "Incorrect password.";
            }
        });
        
    }

    clearFields() {
        this.oldPassword.nativeElement.value = "";
        this.newPassword.nativeElement.value = "";
        this.confirmPassword.nativeElement.value = "";
    }

}
