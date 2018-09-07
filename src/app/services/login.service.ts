import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, of } from 'rxjs';

import { Settings } from '../classes/Settings';

const httpHeaders: HttpHeaders = new HttpHeaders({
    'Content-Type': 'application/json',
    'credentials': 'same-origin'
});

@Injectable({
  providedIn: 'root'
})
export class LoginService {

    constructor(private http: HttpClient) { }

    login(username: String, password: String, stayLogged: boolean): Observable<any> {
        return this.http.request("POST", "/login", {
            observe: 'response', body: JSON.stringify({
                username: username,
                password: password
            }), headers: httpHeaders
        });
    }

    logout(): Observable<any> {
        return this.http.request("POST", "/logout", { observe: 'response', headers: httpHeaders });
    }

    createUser(username: String, password: String, stayLogged: boolean) {
        return this.http.request("POST", "/newuser", {
            observe: 'response', body: JSON.stringify({
                username: username,
                password: password
            }), headers: httpHeaders
        });
    }

    changePassword(oldPassword, newPassword) {
        return this.http.request("POST", "/changepassword", {
            observe: 'response', body: JSON.stringify({
                oldpassword: oldPassword,
                newpassword: newPassword
            }), headers: httpHeaders
        });
    }

    updateUserSettings() {
        return this.http.request("POST", "/user", {
            observe: 'response', body: JSON.stringify({
                dfont: Settings.dFont,
                dfontsize: Settings.dFontSize,
                dcolor: Settings.dColor
            }), headers: httpHeaders
        });
    }
}
