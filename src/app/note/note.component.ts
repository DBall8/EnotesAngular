import { Component, EventEmitter, OnInit, Input, Output, ViewChild, ElementRef } from '@angular/core';

import { NoteService } from '../note.service';
import { Note } from '../note';
import { ColorChart } from '../ColorChart';

/* NoteComponent

Component for displaying a single note

*/

@Component({
  selector: 'app-note',
  templateUrl: './note.component.html',
  styleUrls: ['./note.component.css']
})
export class NoteComponent implements OnInit {

    @Input() note: Note; // The note to display

    @Output() onDrag = new EventEmitter<Object>(); // event for when the user moves the note
    @Output() onResize = new EventEmitter<Object>(); // event for when the user resizes the note
    @Output() onRightClick = new EventEmitter<Object>(); // user right clicks this note event

    @ViewChild('contentArea') contentArea: ElementRef;

  constructor(private noteService: NoteService) { }


    ngOnInit() {
    }

    /* Adds a new note */
    addNote() {
        this.noteService.addNote();
    }

    /* Deletes a note */
    deleteNote() {
        // Confirm the delete
        if (window.confirm("Are you sure you want to delete this note?")) {
            this.noteService.deleteNote(this.note.id);
        }
    }

    /* Loads the note's fields from the Note class */
    setStyles() {
        var styles = {
            'width': this.note.width + "px",
            'height': this.note.height + "px",
            'top': this.note.y + 'px',
            'left': this.note.x + 'px',
            'zIndex': this.note.zindex,
            "background-color": this.note.colors && this.note.colors.body ? this.note.colors.body : ColorChart.yellow.body
            
        }

        return styles;
    }

    /* Sets the color of the top of the note depending on whether or not the note is selected
    @param selected True if the note is focused
    @return The color to make the head of the note
    */
    setHeadColor(selected: boolean) {
        if (selected) {
            return this.note.colors && this.note.colors.head ? this.note.colors.head : ColorChart.yellow.head;
        }
        else {
            return this.note.colors && this.note.colors.body ? this.note.colors.body : ColorChart.yellow.body
        }
    }

    /* Starts a note's drag event
    @param e The mouse event that started the drag
    */
    dragStart(e: MouseEvent) {
        //e.stopPropagation();
        this.onDrag.emit({ note: this.note, x: e.clientX, y: e.clientY });
    }

    /* Starts a note's resize event
    @param e The mouse event that started the resize
    */
    resizeStart(e: MouseEvent) {
        e.stopPropagation();
        e.preventDefault();
        this.onResize.emit({ note: this.note, x: e.clientX, y: e.clientY });
    }

    /* Marks the note as unsaved whenever a change is made */
    keyDown(e) {

        // override tab
        if (e.key == 'Tab') {
            // prevent default behavior
            e.preventDefault();
            
            var cursorStart = this.contentArea.nativeElement.selectionStart;
            var cursorEnd = this.contentArea.nativeElement.selectionEnd;

            var text = this.note.content;
            this.note.content = text.substring(0, cursorStart) + '\t' + text.substring(cursorEnd, text.length);

            setTimeout(() => {
                this.contentArea.nativeElement.selectionStart = cursorStart + 1;
                this.contentArea.nativeElement.selectionEnd = cursorStart + 1;
            })
            
        }
        this.note.saved = false;
        this.noteService.changesSaved = false;
    }

    /* Starts a note's right click event
    @param e The mouse event that launched the right click
    */
    rightClick(e) {
        e.preventDefault();

        var el = this.contentArea.nativeElement;
        var text = this.note.content.substring(el.selectionStart, el.selectionEnd)
        console.log(text)

        this.onRightClick.emit({
            x: e.clientX,
            y: e.clientY,
            note: this.note,
            text: text
        });
    }
}
