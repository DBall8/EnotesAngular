
import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import * as io from 'socket.io-client';

import { NoteService } from '../note.service';
import { Note } from '../note';
import { ColorChart } from '../ColorChart';
import { Config } from '../config';

/* NotePageComponent

A component for managing a list of user's notes

*/

@Component({
  selector: 'app-note-page',
  templateUrl: './note-page.component.html',
  styleUrls: ['./note-page.component.css']
})
export class NotePageComponent implements OnInit {

    username: String = ""; // Username of loggin in user
    socketID = ''; // An id to user on requests to identify this client socket
    socket; // a socket for updating notes when they update in the database

    notes: Note[] = []; // loaded notes
    changesSaved: boolean = true; // boolean for tracking if the the local notes have changed and the database should be updated

    optionsVisible: boolean = false; //boolean for opening or closing the options menu

    // options for controlling the custom right click menu
    rcmDisplay = {
        visible: false, // hide or show the menu
        x: 0, // x position
        y: 0, // y position
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

    constructor(private noteService: NoteService, private router: Router) {
    }

    ngOnInit() {

        // Set up an interval that checks if there are any unsaved chantges and updates the server if there are
        window.setInterval(() => {
            if (!this.changesSaved) { // check is all changes are saved
                this.changesSaved = true;
                // update all unsaved notes
                this.notes.map((n: Note) => {
                    if (!n.saved) {
                        this.updateNote(n);
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

        // Load the user's notes
        if (this.noteService.DEBUG) { // in debug mode just load the dummyNotes
            this.noteService.getNotes().subscribe((notes) => this.notes = notes);
        }
        else {
            // request the user's notes
            this.noteService.getNotes().subscribe((res) => {
                // display error if the http request failed
                if (res.status != 200) {
                    window.alert(res.status + " Error.");
                    return;
                }
                var body = res.body;

                // If unsuccessfull, redirect to login page
                if (body.sessionExpired || !body.successful) {
                    this.redirect();
                    return;
                }

                // On success, set up the note page
                this.username = body.username;
                this.loadNotes(body.notes);
                this.setupSocket();

            }, (error) => console.error(error.error));
        }
        
    }
  
    /* Sets up a socket that notifies this client any time a change is made elsewhere */
    setupSocket() {
        
        // connect to server's socket
        this.socket = io(Config.serverURL);
        
        // receive an ID from the server to identify this client socket
        this.socket.on("ready", (socketid) => {
            this.noteService.loadSocket(socketid);
        })

        // Whenever an update event is received, update the corresponding note
        this.socket.on("update", (body) => {

            var input = JSON.parse(body);

            var note = this.retrieveNote(input.tag);

            if (!note) {
                return;
            }

            note.content = input.newcontent;
            note.x = input.newx;
            note.y = input.newy;
            note.width = input.newW;
            note.height = input.newH;
            note.zindex = input.newZ;
            note.colors = input.newColors;
        })

        // Whenever a create event is received, create a note
        this.socket.on("create", (body) => {
            var input = JSON.parse(body);

            var colors;
            try {
                colors = JSON.parse(input.colors);
            }
            catch (e) {
                console.error("Failed to parse colors json");
                console.error(e);
                console.error(input.colors);
                colors = {};
            }

            var n = new Note(input.tag, input.content, input.x, input.y, input.width, input.height, colors);
            n.zindex = input.zindex;

            this.notes.push(n);
        })

        // Whenever a delete event is received, delete the corresponding note
        this.socket.on("delete", (tag) => {
            this.removeNote(tag);
        })

        // Send a ready event
        this.socket.emit("ready", this.username);
    }

    /* Converts the response from the get notes HTTP request into an array of Note class instances
    @param ns An array of objects representing notes
    */
    loadNotes(ns: any[]) {
        // If the response did not contain any notes, simply add a note and return
        if (ns.length < 1) {
            this.addNote();
            return;
        }

        // make sure there arent already notes loaded
        this.notes = [];

        // map each object to a new note
        ns.map((anote) => {
            // build note class
            var colors;
            try {
                colors = JSON.parse(anote.colors);
            }
            catch (e) {
                console.error("Failed to parse colors json");
                console.error(e);
                console.error(anote.colors);
                colors = {};
            }

            // Create the Note instance
            var note:Note = new Note(anote.tag, anote.content, anote.x, anote.y, anote.width, anote.height, colors);
            note.zindex = anote.zindex;
            // add the note to the array
            this.notes.push(note);
            return;
        });
    }
    
    /* Creates a new empty note */
    addNote() {
        // Create a new note isntance that is empty
        var n: Note = new Note('note-' + new Date().getTime(), "", 200, 200, 200, 200, ColorChart.yellow);
        // add it to the array
        this.notes.push(n);

        if (!this.noteService.DEBUG) {
            // send a request to add the note to the database
            this.noteService.addNote(n).subscribe((res) => {
                // display an error if the request failed
                if (res.status != 200) {
                    window.alert(res.status + " Error.");
                    return;
                }
                var body = res.body;
                // redirect to the login page if the session expired of the addition failed
                if (body.sessionExpired || !body.successful) {
                    this.redirect();
                    return;
                }
            });
        }
    }

    /* Updates a note's contents on the database
    @param note The note to update
    */
    updateNote(note: Note) {
        if (!this.noteService.DEBUG) {
            note.saved = true; // mark the note as saved
            // send an update request
            this.noteService.updateNote(note).subscribe((res) => {
                // display an error if the http request failed
                if (res.status != 200) {
                    window.alert(res.status + " Error.");
                    return;
                }
                var body = res.body;
                // redirect to the login page if the session expired of the update failed
                if (body.sessionExpired || !body.successful) {
                    this.redirect();
                    return;
                }
            });
        }
    }

    /* Deletes a note
    @param noteID The ID of the note to delete
    */
    deleteNote(noteID: String) {
        this.removeNote(noteID); // remove the note locally

        if (!this.noteService.DEBUG) {
            // Send a delete request to the server
            this.noteService.deleteNote(noteID).subscribe((res) => {
                // display an error if the http request failed
                if (res.status != 200) {
                    window.alert(res.status + " Error.");
                    return;
                }
                var body = res.body;
                // redirect to the login page if the session expired of the update failed
                if (body.sessionExpired || !body.successful) {
                    this.redirect();
                    return;
                }
            });
        }
        
    }

    /* Removes a note from the locally array
    @param noteID The id of the note to remove
    */
    removeNote(noteID: String) {
        for (var i = 0; i < this.notes.length; i++) {
            if (this.notes[i].id === noteID) {
                this.notes.splice(i, 1);
                break;
            }
        }
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

            this.changesSaved = false;
            this.resetResize();
        }

        // If a drag event is in progress, update the note's location and end the drag event
        if (this.drag.note) {
            this.drag.note.x = e.clientX - this.drag.offsetX;
            this.drag.note.y = e.clientY - this.drag.offsetY;
            this.drag.note.saved = false;

            this.changesSaved = false;
            this.resetDrag();
        }
    }

    // Mark the note page as containing unsaved changes
    noteChanged() {
        this.changesSaved = false;
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
        this.notes.map((n: Note) => {
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

    /* Searches the notes array for a note
    @param noteID The id of the note to find
    @return a Note class instance with the given ID
    */
    retrieveNote(noteID: String) {
        for (var i:number = 0; i < this.notes.length; i++) {
            if (this.notes[i].id == noteID) {

                return this.notes[i];
            }
        }
        return null;

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
        // reset its submenu
        this.rcmDisplay.subMenu = '';
        // display the rcm
        this.rcmDisplay.visible = true;
    }

    // Reloads the notes from the server
    refresh() { }

    // Opens and closes the options menu
    toggleOptions(e) {
        e.stopPropagation();
        this.optionsVisible = !this.optionsVisible
    }

    // Directs the browser to the login page
    redirect() {
        this.router.navigate(['login']);
    }

}
