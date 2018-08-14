export class Note{
    id: String;
    title: String;
    content: String;
    x: number;
    y: number;
    width: number;
    height: number;
    selected: boolean;
    zindex: number;
    fontSize: number;
    font: String;
    saved: boolean;
    colors;

    constructor(id, title, content, x, y, width, height, colors) {
        this.id = id;
        this.title = title;
        this.content = content;
        this.x = x;
        this.y = y;
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