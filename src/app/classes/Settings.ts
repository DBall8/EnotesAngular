import { ColorChart } from '../exports/ColorChart';

const COOKIE_DAYS = 60;
const DEFAULT_TEXTSIZE = "Medium";
const DEFAULT_DCOLOR = "Yellow";
const DEFAULT_DFONT = "Arial";
const DEFAULT_DFONTSIZE = 12;

export class Settings {
    static textSize: string = DEFAULT_TEXTSIZE;
    static dColor: string = DEFAULT_DCOLOR;
    static dFont: string = DEFAULT_DFONT;
    static dFontSize: number = DEFAULT_DFONTSIZE;

    public static init() {
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

    public static save() {
        this.addCookie("textSize", this.textSize);
        this.addCookie("dFont", this.dFont);
        this.addCookie("dFontSize", String(this.dFontSize));
        this.addCookie("dColor", this.dColor);
    }

    public static restoreDefaults(full: boolean){
        if(full) this.textSize = DEFAULT_TEXTSIZE;
        this.dColor = DEFAULT_DCOLOR;
        this.dFont = DEFAULT_DFONT;
        this.dFontSize = DEFAULT_DFONTSIZE;
    }

    private static addCookie(name: string, val: string) {
        var date = new Date();
        date.setTime(date.getTime() + COOKIE_DAYS * 24 * 60 *  60 * 1000);
        document.cookie = name + "=" + val + "; expires=" + date.toUTCString() + ";";
    }

    public static printSettings() {
        console.log("textSize: " + this.textSize);
        console.log("dColor: " + this.dColor);
        console.log("dFont: " + this.dFont);
        console.log("dFontSize: " + this.dFontSize);
    }
}