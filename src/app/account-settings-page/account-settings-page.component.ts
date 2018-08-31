import { Component, OnInit, Input, Output, EventEmitter, ElementRef, ViewChild } from '@angular/core';

import { LoginService } from '../services/login.service';
import { Settings } from '../classes/Settings';


@Component({
  selector: 'app-account-settings-page',
  templateUrl: './account-settings-page.component.html',
  styleUrls: ['./account-settings-page.component.css']
})
export class AccountSettingsPageComponent implements OnInit {

    @Input() display: boolean;
    @Output() displayChange = new EventEmitter();

    // Text size radio buttons
    textRBGroup: ElementRef[] = [];
    @ViewChild("TextSmallRB") textSmallRB: ElementRef;
    @ViewChild("TextMediumRB") textMediumRB: ElementRef;
    @ViewChild("TextLargeRB") textLargeRB: ElementRef;

    // Default Color radio buttons
    dColorRBGroup: ElementRef[] = [];
    @ViewChild("YellowRB") yellowRB: ElementRef;
    @ViewChild("OrangeRB") orangeRB: ElementRef;
    @ViewChild("RedRB") redRB: ElementRef;
    @ViewChild("GreenRB") greenRB: ElementRef;
    @ViewChild("BlueRB") blueRB: ElementRef;
    @ViewChild("PurpleRB") purpleRB: ElementRef;

    // Default Font radio buttons
    fontRBGroup: ElementRef[] = [];
    @ViewChild("ArialRB") arialRB: ElementRef;
    @ViewChild("PalantinoRB") palantinoRB: ElementRef;
    @ViewChild("CourierRB") courierRB: ElementRef;

    // Default Font radio buttons
    fontSizeRBGroup: ElementRef[] = [];
    @ViewChild("D10RB") d10RB: ElementRef;
    @ViewChild("D12RB") d12RB: ElementRef;
    @ViewChild("D14RB") d14RB: ElementRef;
    @ViewChild("D18RB") d18RB: ElementRef;
    @ViewChild("D24RB") d24RB: ElementRef;
    @ViewChild("D32RB") d32RB: ElementRef;


    // Password inputs
    @ViewChild("OldPassword") oldPassword: ElementRef;
    @ViewChild("NewPassword") newPassword: ElementRef;
    @ViewChild("ConfirmPassword") confirmPassword: ElementRef;

    errorText: String = "";

  constructor(private loginService: LoginService) { }

    ngOnInit() {
        var textSize: string = Settings.textSize;
        this.textRBGroup = [this.textSmallRB, this.textMediumRB, this.textLargeRB];
        this.textRBGroup.map((element: ElementRef) => {
            if (element.nativeElement.labels[0].textContent === textSize) {
                element.nativeElement.checked = true;
            }
        });

        var dColor: string = Settings.dColor;
        this.dColorRBGroup = [this.yellowRB, this.orangeRB, this.redRB, this.greenRB, this.blueRB, this.purpleRB];
        this.dColorRBGroup.map((element: ElementRef) => {
            if (element.nativeElement.labels[0].textContent === dColor) {
                element.nativeElement.checked = true;
            }
        });

        var dFont: string = Settings.dFont;
        this.fontRBGroup = [this.arialRB, this.palantinoRB, this.courierRB];
        this.fontRBGroup.map((element: ElementRef) => {
            if (element.nativeElement.labels[0].textContent === dFont) {
                element.nativeElement.checked = true;
            }
        });

        var dFontSize: number = Settings.dFontSize;
        this.fontSizeRBGroup = [this.d10RB, this.d12RB, this.d14RB, this.d18RB, this.d24RB, this.d32RB];
        this.fontSizeRBGroup.map((element: ElementRef) => {
            if (element.nativeElement.labels[0].textContent === (dFontSize + " pt")) {
                element.nativeElement.checked = true;
            }
        });
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

    save() {
        this.textRBGroup.map((element: ElementRef) => {
            if (element.nativeElement.checked) {
                Settings.textSize = element.nativeElement.labels[0].textContent;
            }
        });

        this.dColorRBGroup.map((element: ElementRef) => {
            if (element.nativeElement.checked) {
                Settings.dColor = element.nativeElement.labels[0].textContent;
            }
        });

        this.fontRBGroup.map((element: ElementRef) => {
            if (element.nativeElement.checked) {
                Settings.dFont = element.nativeElement.labels[0].textContent;
            }
        });

        this.fontSizeRBGroup.map((element: ElementRef) => {
            if (element.nativeElement.checked) {
                var sizeStr = element.nativeElement.labels[0].textContent;
                Settings.dFontSize = Number(sizeStr.substring(0, sizeStr.length - 3));
            }
        });

        Settings.save();

        this.loginService.updateUserSettings().subscribe((res: any) => {
            if (res.status != 200 || !res.body.successful) {
                this.errorText = "Failed to update settings. Please try again later.";
            }
            else {
                this.close();
            }
        });
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
