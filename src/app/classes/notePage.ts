export class NotePage{
    pageID: string;
    name: string;
    active: boolean;

    constructor(pageID: string, name: string) {
        this.name = name;
        this.pageID = pageID;
        this.active = false;
    }
}