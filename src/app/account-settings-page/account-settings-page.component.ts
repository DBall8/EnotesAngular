import { Component, OnInit, Input, Output, EventEmitter, ElementRef, ViewChild } from '@angular/core';

import { LoginService } from '../services/login.service';
import { SettingsService } from '../services/settings.service';

/**

Component for creating an options box that sits over the rest of the window

*/

@Component({
  selector: 'app-account-settings-page',
  templateUrl: './account-settings-page.component.html',
  styleUrls: ['./account-settings-page.component.css']
})
export class AccountSettingsPageComponent implements OnInit {

    @Input() display: boolean; // controls the visibility of the page
    @Output() displayChange = new EventEmitter(); // event that alerts app that settings were changec

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

    errorText: string = ""; // string for placing error messages

  constructor(private loginService: LoginService, private settings: SettingsService) { }

    /**
        On initialization, select the radio buttons corresponding to the current settings
    */
    ngOnInit() {
        // text size
        var textSize: string = this.settings.textSize;
        this.textRBGroup = [this.textSmallRB, this.textMediumRB, this.textLargeRB];
        this.textRBGroup.map((element: ElementRef) => {
            if (element.nativeElement.labels[0].textContent === textSize) {
                element.nativeElement.checked = true;
            }
        });
        // color
        var dColor: string = this.settings.dColor;
        this.dColorRBGroup = [this.yellowRB, this.orangeRB, this.redRB, this.greenRB, this.blueRB, this.purpleRB];
        this.dColorRBGroup.map((element: ElementRef) => {
            if (element.nativeElement.labels[0].textContent === dColor) {
                element.nativeElement.checked = true;
            }
        });
        // font
        var dFont: string = this.settings.dFont;
        this.fontRBGroup = [this.arialRB, this.palantinoRB, this.courierRB];
        this.fontRBGroup.map((element: ElementRef) => {
            if (element.nativeElement.labels[0].textContent === dFont) {
                element.nativeElement.checked = true;
            }
        });
        // font size
        var dFontSize: number = this.settings.dFontSize;
        this.fontSizeRBGroup = [this.d10RB, this.d12RB, this.d14RB, this.d18RB, this.d24RB, this.d32RB];
        this.fontSizeRBGroup.map((element: ElementRef) => {
            if (element.nativeElement.labels[0].textContent === (dFontSize + " pt")) {
                element.nativeElement.checked = true;
            }
        });
    }

    /**
        Whenever a user types into a field, it calls this method, which clears any error message
    */
    onType() {
        if (this.errorText) {
            this.errorText = "";
        }
    }

    /**
        Called when the settings page is closed using the x or cancel button
    */
    close() {
        this.clearFields();
        this.errorText = "";
        this.display = false;
        this.displayChange.emit(false);
    }

    /**
        Called whenever the settings page is closed with the save button
        Updates settings to match the ones selected
    */
    save() {
        // text
        this.textRBGroup.map((element: ElementRef) => {
            if (element.nativeElement.checked) {
                this.settings.textSize = element.nativeElement.labels[0].textContent;
            }
        });
        // color
        this.dColorRBGroup.map((element: ElementRef) => {
            if (element.nativeElement.checked) {
                this.settings.dColor = element.nativeElement.labels[0].textContent;
            }
        });
        // font
        this.fontRBGroup.map((element: ElementRef) => {
            if (element.nativeElement.checked) {
                this.settings.dFont = element.nativeElement.labels[0].textContent;
            }
        });
        // font size
        this.fontSizeRBGroup.map((element: ElementRef) => {
            if (element.nativeElement.checked) {
                var sizeStr = element.nativeElement.labels[0].textContent;
                this.settings.dFontSize = Number(sizeStr.substring(0, sizeStr.length - 3));
            }
        });

        // Save the settings as cookies
        this.settings.save();

        // Update the server about the user settings
        this.loginService.updateUserSettings().subscribe((res: any) => {
            if (res.status != 200 || !res.body.successful) {
                this.errorText = "Failed to update settings. Please try again later.";
            }
            else {
                this.close();
            }
        });
    }

    /**
        Attempts to update the user's password
    */
    updatePassword() {
        // get the values of all three requried fields
        var oldPassword: String = this.oldPassword.nativeElement.value;
        var newPassword: String = this.newPassword.nativeElement.value;
        var confirmPassword: String = this.confirmPassword.nativeElement.value;

        // Make sure all three are filled and not empty
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

        // make sure the new password and the confirm password fields match
        if (confirmPassword !== newPassword) {
            this.errorText = "Error: new passwords do not match.";
            return;
        }

        // tell the server to update to the new password
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

    /**
        clears all fields
    */
    clearFields() {
        this.oldPassword.nativeElement.value = "";
        this.newPassword.nativeElement.value = "";
        this.confirmPassword.nativeElement.value = "";
    }

}
