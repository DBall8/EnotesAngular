
import { Component, OnInit } from '@angular/core';

import { NoteService } from '../note.service';
import { Note } from '../note';



/* NotePageComponent

A component for managing a list of user's notes

*/

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

    constructor(private noteService: NoteService) {
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

        // deselect and move back all notes
        this.noteService.notes.map((n: Note) => {
            n.selected = false;
            n.zindex--;
        });

        // select the given note and bring it to the top
        note.selected = true;
        note.zindex = 9999;
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

    // Reloads the notes from the server
    refresh() {
        this.noteService.getNotes();
    }

    // Opens and closes the options menu
    toggleOptions(e) {
        e.stopPropagation();
        this.optionsVisible = !this.optionsVisible
    }

    getUsername() {
        return this.noteService.username;
    }

    getNotes() {
        return this.noteService.notes;
    }

    showAccountSettings() {
        console.log("HI");
        this.accountSettingsVisible = true;
    }

}
