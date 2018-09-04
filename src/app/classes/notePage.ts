export class NotePage{
    pageID: string;
    name: string;
    index: number;
    active: boolean;

    constructor(pageID: string, name: string, index: number) {
        this.name = name;
        this.pageID = pageID;
        this.index = index;
        this.active = false;
    }
}