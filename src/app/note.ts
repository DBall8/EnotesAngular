export class Note{
    id: String;
    content: String;
    x: number;
    y: number;
    width: number;
    height: number;
    selected: boolean;
    zindex: number;
    saved: boolean;
    colors;

    constructor(id, content, x, y, width, height, colors) {
        this.id = id;
        this.content = content;
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.selected = false;
        this.zindex = 9000;
        this.saved = true;
        this.colors = colors;
    }
}