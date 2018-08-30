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
    prevTitle: string

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
    keyDown(e, inTitle) {

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
                case 'Z':
                case 'y':
                    if (this.ctrlPress) {
                        e.preventDefault();
                        if (this.undoHandler) this.undoHandler.redo();
                    }
                    break;
                case 'Tab':
                    // prevent default behavior
                    e.preventDefault();

                    this.track(inTitle);

                    var cursorStart = this.contentArea.nativeElement.selectionStart;
                    var cursorEnd = this.contentArea.nativeElement.selectionEnd;

                    var text = this.note.content;
                    this.note.content = text.substring(0, cursorStart) + '\t' + text.substring(cursorEnd, text.length);

                    setTimeout(() => {
                        this.contentArea.nativeElement.selectionStart = cursorStart + 1;
                        this.contentArea.nativeElement.selectionEnd = cursorStart + 1;
                    });
                    break;
                case 'Control':
                    if (!this.ctrlPress) {
                        this.ctrlPress = true;
                    }
                    break;
                default:
                    if (inTitle) {
                        this.prevTitle = this.note.title;
                    }
                    else {
                        this.prevContent = this.note.content;
                    }
                    
                
            }
        }
        else if (e.key == 'Tab') {
            e.preventDefault();
            document.execCommand('insertText', false, '\t');
        }

        
    }

    /**
        Event that fires whenever a key is released in when in the note
    */
    keyUp(e) {
        // If in firefox, mark control as un-pressed
        if (Config.isFirefox && e.key == 'Control') {
            this.ctrlPress = false;
        }

        // mark note as unsaved and note page as unsaved
        this.note.saved = false;
        this.noteService.changesSaved = false;
    }

    /**
        Called when a title is double clicked
    */
    selectTitle(e) {
        // focus title and make editable
        e.target.focus();
        e.target.readOnly = false;
        // Select title
        if (this.note.title) {
            e.target.selectionStart = 0;
            e.target.selectionEnd = this.note.title.length;
        }
    }

    /**
        Called when a title is clicked
    */
    titleClick(e) {
        // ready a new undo
        this.resetUndo();
        // Prevent cursor selection if not being edited
        if (e.target.readOnly) {
            e.preventDefault();
        }
    }

    /**
        Called when title loses focus
    */
    deselectTitle(e) {
        // put title back tor read only
        e.target.readOnly = true;
    }

    /**
        Adds a new undoable state to the undohandler
    */
    track(inTitle: boolean) {
        // Make sure undo object exists
        if (!this.undoHandler) return;
        // Save title if event called in the title, or content if called in note content
        if (inTitle) {
            this.undoHandler.track(this.prevTitle, this, inTitle);
        }
        else {
            this.undoHandler.track(this.prevContent, this, inTitle);
        }
    }

    /**
        Resets undo counter to be ready for another undo state
    */
    resetUndo() {
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

    /**
        Changes a note to reflect the undo state being reverted to
    */
    public castUndo(str: string, inTitle: boolean) {
        if (str !== null) {

            // if in title, simply update title
            if (inTitle) {
                this.note.title = str;
                return;
            }

            // otherwise update note content and reset cursor after updates appear on screen
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
