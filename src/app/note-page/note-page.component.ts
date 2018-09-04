﻿
import { Component, OnInit } from '@angular/core';

import { NoteService } from '../services/note.service';
import { Note } from '../classes/note';
import { NotePage } from '../classes/notePage';
import { UndoHandler } from '../classes/undoHandler';
import { Config } from '../exports/config';

const MAX_HEIGHT: number = 130;

/* NotePageComponent

A component for managing a list of user's notes

*/

const TOPZ: number = 9999;
const BOTTOMZ: number = 100;

@Component({
  selector: 'app-note-page',
  templateUrl: './note-page.component.html',
  styleUrls: ['./note-page.component.css']
})
export class NotePageComponent implements OnInit {

    optionsVisible: boolean = false; //boolean for opening or closing the options menu
    accountSettingsVisible: boolean = false;

    // options for controlling the custom right click menu
    rcmDisplay = {
        visible: false, // hide or show the menu
        x: 0, // x position
        y: 0, // y position
        text: "", // the highlighted text at the time of the right click
        subMenu: '', // which submenu is open
        note: null // the note the menu was opened on
    };

    // Object for holding information about the resize event as it unfolds
    resize = {
        note: null,
        startX: 0,
        startY: 0,
        startW: 0,
        startH: 0
    };

    // Object for holding
    drag = {
        note: null,
        offsetX: 0,
        offsetY: 0
    };

    undoHandler: UndoHandler;// = new UndoHandler();

    constructor(public noteService: NoteService) {
        if (Config.isFirefox) {
            this.undoHandler = new UndoHandler();
        }
    }

    ngOnInit() {

        // Set up an interval that checks if there are any unsaved chantges and updates the server if there are
        window.setInterval(() => {
            if (!this.noteService.changesSaved) { // check is all changes are saved
                this.noteService.changesSaved = true;
                // update all unsaved notes
                this.noteService.notes.map((n: Note) => {
                    if (!n.saved) {
                        this.noteService.updateNote(n);
                    }
                })
            }

        }, 1000);

        // Set up a mouse click listener to close menus when a user clicks outside of them
        window.addEventListener("click", (e) => {
            // Determine if click was a right click or not
            var rightClick = false;
            if ("which" in e) {
                //console.log("WHICH: " + e.which);
                rightClick = e.which == 3;
            }
            if ("button" in e) {
                //console.log("BUTTON: " + e.button);
                rightClick = e.button == 2;
            }

            // hide the right click menu if it was visible
            if (!rightClick && this.rcmDisplay.visible) {
                this.rcmDisplay.visible = false;
                this.rcmDisplay.note = null;
            }
            // hide the options menu if it was visible
            if (!rightClick && this.optionsVisible) {
                this.optionsVisible = false;
            }
        });
        // Set up mouse move and mouse up listeners
        window.addEventListener("mousemove", (e) => this.mouseMove(e));
        window.addEventListener("mouseup", (e) => this.mouseUp(e));


        // request the user's notes
        this.noteService.getNotes();
    }

    /* Handles the mouse move event for the window
    @param e The mouse event
    */
    mouseMove(e: MouseEvent) {
        // If a note drag is in progress, update the notes location
        if (this.drag.note) {
            this.drag.note.x = e.clientX - this.drag.offsetX;
            this.drag.note.y = e.clientY - this.drag.offsetY;
            if (this.drag.note.y < MAX_HEIGHT) this.drag.note.y = MAX_HEIGHT;
            if (this.drag.note.x < 0) this.drag.note.x = 0;
            
        }
        // If a note resize is in progress, update the notes size
        if (this.resize.note) {
            this.resize.note.width = this.resize.startW + e.clientX - this.resize.startX;
            this.resize.note.height = this.resize.startH + e.clientY - this.resize.startY;
        }
    }

    /* Handles the mouse up event for the window
    @param e The mouse event
    */
    mouseUp(e: MouseEvent) {
        // If a resize event is in progress, update the note's size and end the resize event
        if (this.resize.note) {
            this.resize.note.width = this.resize.startW + e.clientX - this.resize.startX;
            this.resize.note.height = this.resize.startH + e.clientY - this.resize.startY;
            this.resize.note.saved = false;

            this.noteService.changesSaved = false;
            this.resetResize();
        }

        // If a drag event is in progress, update the note's location and end the drag event
        if (this.drag.note) {
            this.drag.note.x = e.clientX - this.drag.offsetX;
            this.drag.note.y = e.clientY - this.drag.offsetY;
            if (this.drag.note.y < MAX_HEIGHT) this.drag.note.y = MAX_HEIGHT;
            if (this.drag.note.x < 0) this.drag.note.x = 0;
            this.drag.note.saved = false;

            this.noteService.changesSaved = false;
            this.resetDrag();
        }
    }

    /* Selects a note (brings it to focus) and pushes back all other notes
    @param note The note to bring to the front
    */
    selectNote(note: Note) {
        
        // If the note is already selected, do nothing
        if (note.selected) {
            return;
        }

        var topZ: number = 0;
        
        // deselect all notes, and find the highest z index
        this.noteService.notes.map((n: Note) => {
            if (n.selected) n.selected = false;
            if (n.zindex > topZ) {
                topZ = n.zindex
            }
        });

        if (topZ >= TOPZ) {
            this.restackNotes();
            topZ = BOTTOMZ + this.noteService.notes.length;
        }

        // select the given note and bring it to the top
        note.selected = true;
        note.zindex = topZ + 1;
        this.noteService.updateNote(note);
    }

    /* When a note has reached the top z index, it takes all notes and restacks them so that large
    * ranges of zindex do not happen (ex. if you click back and forth between two notes, you might have
    * one with zindex 110, one with 980, and one with 981. This puts them back to 100, 101, 102 )
    * And then also updates the server about each note.
    */
    restackNotes() {
        var notes: Note[] = this.noteService.notes;
        var len = notes.length;
        var swapNote: Note;

        for (var i = 0; i < len; i++) {
            for (var j = 0; j < len - i - 1; j++) {
                if (notes[j].zindex > notes[j+1].zindex) {
                    swapNote = notes[j];
                    notes[j] = notes[j + 1]
                    notes[j + 1] = swapNote;
                }
            }
        }

        for (var i = 0; i < len; i++) {
            notes[i].zindex = BOTTOMZ + i;
            this.noteService.updateNote(notes[i]);
        }
    }

    /* Starts a note drag event
    @param event The event emitted by the note thats being dragged
    */
    noteDragStart(event) {
        // Save the note and the mouse's offset from from the note's position for later use when the mouse is moved
        this.drag = {
            note: event.note,
            offsetX: event.x - event.note.x,
            offsetY: event.y - event.note.y
        }
    }

    /* Starts a note resize event
    @param event The event emitted by the note thats being resized
    */
    noteResizeStart(event) {
        // Save the note, the mouse's start position, and the note's starting size for later use when the mouse is moved
        this.resize = {
            note: event.note,
            startX: event.x,
            startY: event.y,
            startW: event.note.width,
            startH: event.note.height
        }
    }

    // Resets the resize event object
    resetResize() {
        this.resize = {
            note: null,
            startX: 0,
            startY: 0,
            startW: 0,
            startH: 0
        };
        
    }

    // Resets the drag event object
    resetDrag() {
        this.drag = {
            note: null,
            offsetX: 0,
            offsetY: 0
        };
    }

    /* Launches a right click menu when a note's right click event is received
    @param e The event emitted by the note
    */
    noteRightClicked(e) {
        // update the right click menu's (rcm) position
        this.rcmDisplay.x = e.x;
        this.rcmDisplay.y = e.y;
        // make the note visible to the rcm
        this.rcmDisplay.note = e.note;
        this.rcmDisplay.text = e.text;
        // reset its submenu
        this.rcmDisplay.subMenu = '';
        // display the rcm
        this.rcmDisplay.visible = true;
    }

    /*
        Called when a page tab is clicked on. Switched to that page
    */
    tabClick(page) {
        this.noteService.selectNotePage(page.pageID);
    }

    /*
        Called when a mouse is pressed on a page tab. Prevents the text from being highlighted if not editing the tab name
    */
    tabMouseDown(e) {
        if (!e.target.highlight) {
            e.preventDefault();
        }
    }

    /*
        Filters the input into the tab name. Prevents newlines and text longer than 100 characters
    */
    filterKeys(e, page) {
        // override the enter key to simply stop editing the name
        if (e.key == 'Enter') {
            e.preventDefault();
            this.blurTab(e.target, page);
        }
        // Cap length at 100
        else if (e.target.textContent.length >= 100 && e.key !== 'Delete' && e.key != 'Backspace') {
            // If the name is max length and a non delete key was pressed, check if anything is highlighted
            var range = window.getSelection().getRangeAt(0);
            var cursorStart = range.startOffset;
            var cursorEnd = range.endOffset;

            // if nothing highlighted, prevent input
            if (cursorEnd - cursorStart <= 0) {
                e.preventDefault();
            }

            // if text somehow got longer than 100 characters, chop off the end
            if (e.target.textContent.length > 100) {
                e.target.textContent = e.target.textContent.substring(0, 101);
            }
        }

        
    }

    /*
        Called on input to page name. Double checks there are no invalid characters and removes any found
    */
    filterInputs(e) {
        // if a new line somehow got in, remove it (moves cursor position so only do if needed)
        if (e.target.textContent.indexOf(/\n/g) > -1) {
            e.target.textContent = e.target.textContent.replace(/\n/g, "");
        }
    }

    editTab(e, target, length) {
        if (!target) return;
        target.contentEditable = true;
        target.highlight = true;
        target.focus();

        // dont select anything if there is nothing to select
        if (length <= 0) return;
        
        var range;

        if (typeof document.createRange != "undefined") {
            if (typeof e.rangeParent != "undefined") {
                range = document.createRange();
                range.setStart(e.rangeParent, 0);
                range.setEnd(e.rangeParent, length);
            }
        }

        if (range) {
            if (typeof range.select != "undefined") {
                range.select();
            } else if (typeof window.getSelection != "undefined") {
                var sel = window.getSelection();
                sel.removeAllRanges();
                sel.addRange(range);
            }
        }
        
    }

    blurTab(target, page) {
        target.contentEditable = false;
        target.highlight = false;
        //target.setAttribute("disabled");
        page.name = target.textContent;
        this.noteService.updateNotePage(page);
        target.textContent = page.name;
    }

    addTab() {
        this.noteService.addNotePage("");
    }

    deleteTab(page) {
        if (window.confirm("Are you sure you want to delete this page? WARNING: All notes on this page will be deleted and cannot be recovered.")) {
            this.noteService.deleteNotePage(page.pageID);
        }
    }

    // Reloads the notes from the server
    refresh() {
        this.noteService.refreshNotes();
    }

    // Opens and closes the options menu
    toggleOptions(e) {
        e.stopPropagation();
        this.optionsVisible = !this.optionsVisible
    }

    getUsername() {
        return this.noteService.username;
    }

    showAccountSettings() {
        this.accountSettingsVisible = true;
    }

}
