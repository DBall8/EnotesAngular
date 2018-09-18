/**
    A class for holding information pertaining to a note page
*/

export class NotePage{
    pageID: string; // unique identifier for the note page
    name: string; // the name of the note page
    index: number; // the index of the page to use in ordering
    active: boolean; // a boolean for tracking if the page is currently being displayed

    constructor(pageID: string, name: string, index: number) {
        this.name = name;
        this.pageID = pageID;
        this.index = index;
        this.active = false;
    }
}