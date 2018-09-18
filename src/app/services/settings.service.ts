import { Injectable } from '@angular/core';

const COOKIE_DAYS = 60;
const DEFAULT_TEXTSIZE = "Medium";
const DEFAULT_DCOLOR = "Yellow";
const DEFAULT_DFONT = "Arial";
const DEFAULT_DFONTSIZE = 12;

@Injectable({
  providedIn: 'root'
})
export class SettingsService {

    textSize: string = DEFAULT_TEXTSIZE;
    dColor: string = DEFAULT_DCOLOR;
    dFont: string = DEFAULT_DFONT;
    dFontSize: number = DEFAULT_DFONTSIZE;

    constructor() { }

    public init() {
        var cookies: string[] = document.cookie.split(";");
        var cookieObj: any = {};
        cookies.map((cookie: string) => {
            var splitCookie: string[] = cookie.split("=");
            cookieObj[splitCookie[0].trim()] = splitCookie[1];
        });

        if (cookieObj.textSize) this.textSize = cookieObj.textSize;
        if (cookieObj.dFont) this.dFont = cookieObj.dFont;
        if (cookieObj.dFontSize) this.dFontSize = cookieObj.dFontSize;
        if (cookieObj.dColor) this.dColor = cookieObj.dColor;

        this.save();
    }

    public save() {
        this.addCookie("textSize", this.textSize);
        this.addCookie("dFont", this.dFont);
        this.addCookie("dFontSize", String(this.dFontSize));
        this.addCookie("dColor", this.dColor);
    }

    public restoreDefaults(full: boolean) {
        if (full) this.textSize = DEFAULT_TEXTSIZE;
        this.dColor = DEFAULT_DCOLOR;
        this.dFont = DEFAULT_DFONT;
        this.dFontSize = DEFAULT_DFONTSIZE;
    }

    private addCookie(name: string, val: string) {
        var date = new Date();
        date.setTime(date.getTime() + COOKIE_DAYS * 24 * 60 * 60 * 1000);
        document.cookie = name + "=" + val + "; expires=" + date.toUTCString() + ";";
    }

    public printSettings() {
        console.log("textSize: " + this.textSize);
        console.log("dColor: " + this.dColor);
        console.log("dFont: " + this.dFont);
        console.log("dFontSize: " + this.dFontSize);
    }
}
