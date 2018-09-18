/**
    A class for storing information pertaining to a note
*/

export class Note{
    id: string; // unique identifier for the note
    pageID: string; // the ID of the page the note belongs to
    title: string; // the title of the note
    content: string; // the text content of the note
    x: number; // the x coordinate of the note
    y: number; // the y coordinate of the note
    width: number; // the width of the note
    height: number; // the height of the note
    selected: boolean; // true if the note is focused, false otherwise
    zindex: number; // the index to use to stack the note on the screen
    fontSize: number; // the size of the font of the note
    font: String; // the font to use for the note
    saved: boolean; // true if the note has been saved to the server
    colors; // json containing the colors to use for the note

    constructor(id, pageID, title, content, x, y, width, height, colors) {
        this.id = id;
        this.pageID = pageID;
        this.title = title;
        this.content = content;
        this.x = x;
        this.y = y;
        if (this.y < 10) this.y = 10;
        this.width = width;
        this.height = height;
        this.selected = false;
        this.fontSize = 12;
        this.font = "Arial";
        this.zindex = 9000;
        this.saved = true;
        this.colors = colors;
    }
}