import { Component, OnInit, ElementRef, ViewChild } from '@angular/core';
import { Router } from '@angular/router';

import { LoginService } from '../services/login.service';

/* Login

Component for displaying the log in and new user screens

*/

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})

export class LoginComponent implements OnInit {

    @ViewChild('Username') usernameInput: ElementRef; // username field
    @ViewChild('Password') passwordInput: ElementRef; // password field
    @ViewChild('ConfirmPassword') confirmPasswordInput: ElementRef; // confirm password field (for new users)
    @ViewChild('stayLogged') stayLoggedCheckbox: ElementRef;

    errorText: String = ""; // error message
    isLogin: boolean = true; // true if the user is logging in to an existing account, false if user is creating an account
     
    constructor(private loginService: LoginService, private router: Router) { }

  ngOnInit() {
  }

    /* Attempts to log in a user or create a new user
    @param username The given username input
    @param password The given password input
    @param confirmPassword The confirm password field input
    */
    login(username: String, password: String, confirmPassword: String) {

        // Make sure neither field is blank
        if (!username) {
            this.errorText = "Please enter a username.";
            return;
        }
        if (!password) {
            this.errorText = "Please enter a password.";
            return;
        }

        var stayLogged: boolean = this.stayLoggedCheckbox.nativeElement.checked;

        // If on log in page, attempt to log in
        if (this.isLogin) {
           
            // send a login request
            this.loginService.login(username, password, stayLogged).subscribe((res: any) => {
                if (res.status != 200) { // display error
                    this.errorText = res.status + " Error.";
                    return;
                }
                // on success, navigate to notes page
                if (res.body.successful) {
                    this.router.navigate(['/']);
                }
                else { // display error
                    this.errorText = "Incorrect username or password."
                }
            });
        }
        // If on new user page, attempt to create a new user
        else {
            // make sure the confirm password field isnt empty
            if (!confirmPassword) {
                this.errorText = "Please confirm the password.";
                return;
            }
            // Make sure passwords match
            if (password !== confirmPassword) {
                this.errorText = "Passwords do not match.";
                return;
            }

            // send a create user request
            this.loginService.createUser(username, password, stayLogged).subscribe((res: any) => {
                // display error
                if (res.status != 200) {
                    this.errorText = res.status + " Error.";
                    return;
                }
                // Display error if username is taken already
                if (res.body.userAlreadyExists) {
                    this.errorText = "Username is already taken.";
                }
                // On success, navigate to notes page
                else {
                    this.router.navigate(['/']);
                }
            });
        }
    }

    /* Looks at key presses made while on the input field, and submits the form if the enter button is pressed
    @param key The key being pressed
    */
    submit(key) {
        // As the user types, remove the error message
        if (this.errorText) {
            this.errorText = '';
        }
        // Submit the form if the key is enter
        if (key == 'Enter') {
            this.login(this.usernameInput.nativeElement.value, this.passwordInput.nativeElement.value, this.confirmPasswordInput.nativeElement.value);
        }
        
    }

    /* Clears the fields of the form */
    clearFields() {
        this.usernameInput.nativeElement.value = '';
        this.passwordInput.nativeElement.value = '';
        this.confirmPasswordInput.nativeElement.value = '';
    }

}
