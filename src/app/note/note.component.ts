import { Component, EventEmitter, OnInit, Input, Output, ViewChild, ElementRef } from '@angular/core';

import { NoteService } from '../services/note.service';
import { Note } from '../classes/note';
import { ColorChart } from '../exports/ColorChart';
import { UndoHandler } from '../classes/undoHandler';
import { Config } from '../exports/config';

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
    @Input() undoHandler: UndoHandler;

    @Output() onDrag = new EventEmitter<Object>(); // event for when the user moves the note
    @Output() onResize = new EventEmitter<Object>(); // event for when the user resizes the note
    @Output() onRightClick = new EventEmitter<Object>(); // user right clicks this note event

    @ViewChild('contentArea') contentArea: ElementRef;

    ctrlPress: boolean = false;
    prevContent: string;

    constructor(private noteService: NoteService) { }


    ngOnInit() {
    }

    /* Adds a new note */
    addNote() {
        this.noteService.addNote(this.note.x + 100, this.note.y + 100);
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

        if (Config.isFirefox) {

            switch (e.key) {
//                case 'Enter':
//                    this.pushUndo(this.note.content);
//                    break;
                case 'z':
                    if (this.ctrlPress) {
                        e.preventDefault();
                        if (this.undoHandler) this.undoHandler.undo();
                    }
                    break;
                case 'Tab':
                    // prevent default behavior
                    e.preventDefault();

                    if(this.undoHandler) this.undoHandler.track(this.note.content, this);

                    var cursorStart = this.contentArea.nativeElement.selectionStart;
                    var cursorEnd = this.contentArea.nativeElement.selectionEnd;

                    var text = this.note.content;
                    this.note.content = text.substring(0, cursorStart) + '\t' + text.substring(cursorEnd, text.length);

                    setTimeout(() => {
                        this.contentArea.nativeElement.selectionStart = cursorStart + 1;
                        this.contentArea.nativeElement.selectionEnd = cursorStart + 1;
                    });
                case 'Control':
                    if (!this.ctrlPress) {
                        this.ctrlPress = true;
                    }
                    break;
                default:
                    this.prevContent = this.note.content;
                
            }
        }
        else if (e.key == 'Tab') {
            e.preventDefault();
            document.execCommand('insertText', false, '\t');
        }

        
    }

    keyUp(e) {

        if (Config.isFirefox && e.key == 'Control') {
            this.ctrlPress = false;
        }

        this.note.saved = false;
        this.noteService.changesSaved = false;
    }

    onInput() {
        if (this.undoHandler) this.undoHandler.track(this.prevContent, this);
    }

    onFocus() {
        if (this.undoHandler) this.undoHandler.readyUndo();
    }

    /* Starts a note's right click event
    @param e The mouse event that launched the right click
    */
    rightClick(e) {
        e.preventDefault();

        var el = this.contentArea.nativeElement;
        var text = this.note.content.substring(el.selectionStart, el.selectionEnd)

        this.onRightClick.emit({
            x: e.clientX,
            y: e.clientY,
            note: this.note,
            text: text
        });
    }

    public castUndo(str: string) {
        if (str !== null) {
            var cursorStart = this.contentArea.nativeElement.selectionStart;
            var cursorEnd = this.contentArea.nativeElement.selectionEnd;

            var delta = this.note.content.length - str.length;
            var newPos = cursorStart - delta;
            this.note.content = str;

            setTimeout(() => {
                this.contentArea.nativeElement.selectionStart = newPos;
                this.contentArea.nativeElement.selectionEnd = newPos;
            });
        }
    }
}
