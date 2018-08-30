import { ColorChart } from '../exports/ColorChart';

const COOKIE_DAYS = 60;

export class Settings {
    static textSize: string = "Medium";
    static dColor: string = "Yellow";
    static dFont: string = "Arial";
    static dFontSize: number = 12;

    public static init() {
        var cookies: string[] = document.cookie.split(";");
        var cookieObj: any = {};
        cookies.map((cookie: string) => {
            var splitCookie: string[] = cookie.split("=");
            cookieObj[splitCookie[0].trim()] = splitCookie[1];
        });

        console.log(cookieObj);

        if (cookieObj.textSize) this.textSize = cookieObj.textSize;
        if (cookieObj.dColor) this.dColor = cookieObj.dColor;
        if (cookieObj.dFont) this.dFont = cookieObj.dFont;
        if (cookieObj.dFontSize) this.dFontSize = cookieObj.dFontSize;
    }

    public static save() {
        this.addCookie("textSize", this.textSize);
        this.addCookie("dColor", this.dColor);
        this.addCookie("dFont", this.dFont);
        this.addCookie("dFontSize", String(this.dFontSize));
    }

    private static addCookie(name: string, val: string) {
        var date = new Date();
        date.setTime(date.getTime() + COOKIE_DAYS * 24 * 60 *  60 * 1000);
        document.cookie = name + "=" + val + "; expires=" + date.toUTCString() + ";";
    }
}