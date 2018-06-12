import { Component, OnInit, ElementRef, ViewChild } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Router } from '@angular/router';

const httpOptions = {
    headers: new HttpHeaders({
        'Content-Type': 'application/json'
    })
};

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})

export class LoginComponent implements OnInit {

    @ViewChild('Username') usernameInput: ElementRef;
    @ViewChild('Password') passwordInput: ElementRef;

    errorText: String = "";
     
    constructor(private http: HttpClient, private router: Router) { }

  ngOnInit() {
  }

    login(username: String, password: String) {
        this.http.post("/login", { username: username, password: password }, httpOptions).subscribe((res:any) => {
            if (res.successful) {
                this.router.navigate(['/']);
            }
        });
    }

    submit(key) {
        if (key == 'Enter') {
            this.login(this.usernameInput.nativeElement.value, this.passwordInput.nativeElement.value);
        }
        
    }

    clearFields() {
        this.usernameInput.nativeElement.value == '';
        this.passwordInput.nativeElement.value == '';
    }

}
