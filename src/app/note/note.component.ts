import { Component, EventEmitter, OnInit, Input, Output } from '@angular/core';

import { Note } from '../note';
import { ColorChart } from '../ColorChart';

@Component({
  selector: 'app-note',
  templateUrl: './note.component.html',
  styleUrls: ['./note.component.css']
})
export class NoteComponent implements OnInit {

    @Input() note: Note;
    @Output() onDrag = new EventEmitter<Object>();
    @Output() onResize = new EventEmitter<Object>();

    bgColor: String = ColorChart.yellow.body;
    headColor: String = ColorChart.yellow.head;

  constructor() { }


    ngOnInit() {
        this.bgColor = this.note.colors && this.note.colors.body ? this.note.colors.body : ColorChart.yellow.body;
        this.headColor = this.note.colors && this.note.colors.head ? this.note.colors.head : ColorChart.yellow.head;
     }

    setStyles() {
        var styles = {
            'width': this.note.width + "px",
            'height': this.note.height + "px",
            'top': this.note.y + 'px',
            'left': this.note.x + 'px',
            "background-color": this.note.colors && this.note.colors.body ? this.note.colors.body : ColorChart.yellow.body
            
        }

        return styles;
    }

    dragStart(e: MouseEvent) {
        e.stopPropagation();
        this.onDrag.emit({ noteID: this.note.id, x: e.clientX, y: e.clientY });
    }

    resizeStart(e: MouseEvent) {
        e.stopPropagation();
        e.preventDefault();
        this.onResize.emit({ noteID: this.note.id, x: e.clientX, y: e.clientY });
    }

}
