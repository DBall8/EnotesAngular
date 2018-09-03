import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { Router } from '@angular/router';
import * as io from 'socket.io-client';

import { Config } from '../exports/config';
import { Settings } from '../classes/Settings';
import { Note } from '../classes/note';
import { NotePage } from '../classes/notePage';
import { ColorChart } from '../exports/ColorChart';

const httpHeaders: HttpHeaders = new HttpHeaders({
    'Content-Type': 'application/json',
    'credentials': 'same-origin'
});

@Injectable({
  providedIn: 'root'
})
export class NoteService {
    
    notes: Note[] = [];
    visibleNotes: Note[] = [];
    notePages: NotePage[] = [];

    currentPageID: string = "";
    changesSaved: boolean = true; // boolean for tracking if the the local notes have changed and the database should be updated
    username: String = '';
    socketID: String = "";
    socket = null;

    dummyNotes = [
        new Note("note-123", "p-1", "Title1", "test", 100, 100, 200, 200, ""),
        new Note("note-456", "p-1", "", "test1", 400, 400, 300, 300, ""),
        new Note("note-789", "p-1", "RUN", "test2", 800, 300, 400, 400, "")
    ];

    dummyPages = [
        new NotePage("p-1", "Main"),
        new NotePage("p-2", "Work"),
        new NotePage("p-3", "Food")
    ]


    constructor(private http: HttpClient, private router: Router) { }

    getNotes() {
        if (Config.DEBUG) {
            this.notes = this.dummyNotes;
            this.notePages = this.dummyPages;
            if (this.notePages.length <= 0) this.addNotePage("Main Page");
            this.selectNotePage(this.notePages[0].pageID);
        }
        else {
            this.http.request("GET", "/api", { observe: 'response', headers: httpHeaders }).subscribe((res) => {

                if (res.status != 200) {
                    window.alert(res.status + " Error.");
                    return;
                }
                var body:any = res.body;

                // If unsuccessfull, redirect to login page
                if (body.sessionExpired || !body.successful) {
                    this.redirect();
                    return;
                }

                // On success, set up the note page
                this.username = body.username;
                this.currentPageID = this.username + "-default";
                this.loadNotePages(body.notePages)
                this.loadNotes(body.notes);
                this.selectNotePage(this.notePages[0].pageID);
                this.setupSocket();
            }, (error) => console.error(error.error));
        }
    }

    /**
        Same as get notes, except does not try to restart the socket
    */
    refreshNotes() {
        if (Config.DEBUG) {
            this.notes = this.dummyNotes;
        }
        else {
            this.http.request("GET", "/api", { observe: 'response', headers: httpHeaders }).subscribe((res) => {

                if (res.status != 200) {
                    window.alert(res.status + " Error.");
                    return;
                }
                var body: any = res.body;

                // If unsuccessfull, redirect to login page
                if (body.sessionExpired || !body.successful) {
                    this.redirect();
                    return;
                }

                // On success, set up the note page
                this.loadNotePages(body.notePages);
                this.loadNotes(body.notes);
                this.selectNotePage(this.currentPageID);
            }, (error) => console.error(error.error));
        }
    }

    /* Converts the response from the get notes HTTP request into an array of Note class instances
    @param ns An array of objects representing notes
    */
    loadNotes(ns: any[]) {
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
            var note: Note = new Note(anote.tag, anote.pageid, anote.title, anote.content, anote.x, anote.y, anote.width, anote.height, colors);
            if (note.fontSize) { note.fontSize = anote.fontsize; }
            if (note.font) { note.font = anote.font; }
            note.zindex = anote.zindex;
            // add the note to the array
            this.notes.push(note);
            
            return;
        });
    }

    /* Adds a new note and sends it to the database to be added */
    addNote(x: number, y: number) {
        // Create a new note isntance that is empty
        var note: Note = new Note('note-' + new Date().getTime(), this.currentPageID, "", "", x, y, 200, 200, ColorChart.yellow);
        if(Settings.dFont) note.font = Settings.dFont;
        if (Settings.dFontSize) note.fontSize = Settings.dFontSize;
        if (Settings.dColor) note.colors = ColorChart[Settings.dColor.toLowerCase()];
        note.zindex = 9999;
        // add it to the array
        this.notes.push(note);
        if (this.currentPageID == note.pageID) this.visibleNotes.push(note);

        if (!Config.DEBUG) {
            // send a request to add the note to the database
            this.http.request("POST", "/api", {
                observe: 'response', body: JSON.stringify({
                    tag: note.id,
                    pageID: note.pageID,
                    title: note.title,
                    content: note.content,
                    x: note.x,
                    y: note.y,
                    width: note.width,
                    height: note.height,
                    zindex: note.zindex,
                    fontSize: note.fontSize,
                    font: note.font,
                    colors: note.colors,
                    socketid: this.socketID
                }),
                headers: httpHeaders
            }
            ).subscribe((res) => {
                // display an error if the request failed
                if (res.status != 200) {
                    window.alert(res.status + " Error.");
                    return;
                }
                var body:any = res.body;
                // redirect to the login page if the session expired of the addition failed
                if (body.sessionExpired || !body.successful) {
                    this.redirect();
                    return;
                }
            });
        }
    }

    /* Sends a note to the server to update the database
    @param note The note to send
    */
    updateNote(note: Note) {

        if (!Config.DEBUG) {
            note.saved = true; // mark the note as saved
            // send an update request
            this.http.request("PUT", "/api", {
                observe: 'response', body: JSON.stringify({
                    tag: note.id,
                    title: note.title,
                    content: note.content,
                    x: note.x,
                    y: note.y,
                    width: note.width,
                    height: note.height,
                    fontSize: note.fontSize,
                    font: note.font,
                    zindex: note.zindex,
                    colors: note.colors,
                    socketid: this.socketID
                }),
                headers: httpHeaders
            }
            ).subscribe((res) => {
                // display an error if the http request failed
                if (res.status != 200) {
                    window.alert(res.status + " Error.");
                    return;
                }
                var body:any = res.body;
                // redirect to the login page if the session expired of the update failed
                if (body.sessionExpired || !body.successful) {
                    this.redirect();
                    return;
                }
            });
        }

    }

    /* Deletes a note locally and from the database
    @param noteID The ID of the note to delete
    */
    deleteNote(noteID: String) {

        this.removeNote(noteID); // remove the note locally

        if (!Config.DEBUG) {
            // Send a delete request to the server
            this.http.request("DELETE", "/api", {
                body: JSON.stringify({
                    tag: noteID,
                    socketid: this.socketID
                }),
                observe: 'response',
                headers: httpHeaders
            }
            ).subscribe((res) => {
                // display an error if the http request failed
                if (res.status != 200) {
                    window.alert(res.status + " Error.");
                    return;
                }
                var body:any = res.body;
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
        for (var i = 0; i < this.visibleNotes.length; i++) {
            if (this.visibleNotes[i].id === noteID) {
                this.visibleNotes.splice(i, 1);
                break;
            }
        }

        if (this.visibleNotes.length < 1) {
            this.addNote(200, 200);
        }
    }

    loadNotePages(pages: any[]) {
        this.notePages = [];

        // If the response did not contain any notes, simply add a note and return
        if (pages.length < 1) {
            this.addNotePage("Main Page");
            return;
        }

        // map each object to a new note
        pages.map((apage) => {
            
            // Create the NotePage instance
            var page: NotePage = new NotePage(apage.pageid, apage.name);
            // add the note page to the array
            this.notePages.push(page);

            return;
        });
    }

    addNotePage(name) {
        var newPage: NotePage = new NotePage("page-" + new Date().getTime(), name);
        this.notePages.push(newPage);

        if (!Config.DEBUG) {
            // send a request to add the note to the database
            this.http.request("POST", "/notepage", {
                observe: 'response', body: JSON.stringify({
                    pageID: newPage.pageID,
                    name: newPage.name,
                    socketid: this.socketID
                }),
                headers: httpHeaders
            }
            ).subscribe((res) => {
                // display an error if the request failed
                if (res.status != 200) {
                    window.alert(res.status + " Error.");
                    return;
                }
                var body: any = res.body;
                // redirect to the login page if the session expired of the addition failed
                if (body.sessionExpired || !body.successful) {
                    this.redirect();
                    return;
                }
            });
        }
    }

    deleteNotePage(pageID) {
        this.removePage(pageID)
        if (this.notePages.length <= 0) this.addNotePage("Main Page");
        this.selectNotePage(this.notePages[0].pageID);

        if (!Config.DEBUG) {
            // Send a delete request to the server
            this.http.request("DELETE", "/notepage", {
                body: JSON.stringify({
                    pageID: pageID,
                    socketid: this.socketID
                }),
                observe: 'response',
                headers: httpHeaders
            }
            ).subscribe((res) => {
                // display an error if the http request failed
                if (res.status != 200) {
                    window.alert(res.status + " Error.");
                    return;
                }
                var body: any = res.body;
                // redirect to the login page if the session expired of the update failed
                if (body.sessionExpired || !body.successful) {
                    this.redirect();
                    return;
                }
            });
        }
    }

    removePage(pageID: string) {
        for (var i = 0; i < this.notePages.length; i++) {
            if (this.notePages[i].pageID === pageID) {
                this.notePages.splice(i, 1);
                break;
            }
        }
    }

    updateNotePage(page) {
        if (!Config.DEBUG) {
            // send an update request
            this.http.request("PUT", "/notepage", {
                observe: 'response', body: JSON.stringify({
                    pageID: page.pageID,
                    name: page.name,
                    socketid: this.socketID
                }),
                headers: httpHeaders
            }
            ).subscribe((res) => {
                // display an error if the http request failed
                if (res.status != 200) {
                    window.alert(res.status + " Error.");
                    return;
                }
                var body: any = res.body;
                // redirect to the login page if the session expired of the update failed
                if (body.sessionExpired || !body.successful) {
                    this.redirect();
                    return;
                }
            });
        }
    }

    selectNotePage(pageID: string) {
        this.notePages.map((page) => {
            if (page.pageID === pageID) {
                page.active = true
            }
            else {
                page.active = false
            }
            
        });
        this.currentPageID = pageID;

        this.visibleNotes = [];
        this.notes.map((note) => {
            if (note.pageID === this.currentPageID) {
                this.visibleNotes.push(note);
            }
        })

        // If the response did not contain any notes, simply add a note and return
        if (this.visibleNotes.length < 1) {
            this.addNote(200, 200);
            return;
        }

    }

    /* Sets up a socket that notifies this client any time a change is made elsewhere */
    setupSocket() {

        // connect to server's socket
        if (this.socket) this.socket.disconnect();
        this.socket = io(Config.serverURL, { secure: true });

        // receive an ID from the server to identify this client socket
        this.socket.on("ready", (socketid) => {
            if (this.socketID !== "") {
                this.refreshNotes();
            }
            this.socketID = socketid;
            // Respond with a ready event
            this.socket.emit("ready", this.username);
        })

        // Whenever an update event is received, update the corresponding note
        this.socket.on("update", (body) => {

            var input = JSON.parse(body);

            var note = this.retrieveNote(input.tag);

            if (!note) {
                return;
            }

            note.title = input.title;
            note.content = input.content;
            note.x = input.x;
            note.y = input.y;
            note.width = input.width;
            note.height = input.height;
            if (note.fontSize) { note.fontSize = input.fontSize; }
            if (note.font) { note.font = input.font; }
            note.zindex = input.zindex;
            note.colors = input.colors;
        })

        // Whenever a create event is received, create a note
        this.socket.on("create", (body) => {
            var input = JSON.parse(body);

            var n = new Note(input.tag, input.pageID, input.title, input.content, input.x, input.y, input.width, input.height, input.colors);
            if (n.fontSize) { n.fontSize = input.fontSize; }
            if (n.font) { n.font = input.font; }
            n.zindex = input.zindex;

            this.notes.push(n);
            if (this.currentPageID === n.pageID) this.visibleNotes.push(n);
        })

        // Whenever a delete event is received, delete the corresponding note
        this.socket.on("delete", (tag) => {
            this.removeNote(tag);
        })

        // Whenever a create page event is received, create a note page
        this.socket.on("createpage", (body) => {
            var input = JSON.parse(body);
            var p = new NotePage(input.pageID, input.name);
            this.notePages.push(p);
        })

        // Whenever an update page event is received, update the note page
        this.socket.on("updatepage", (body) => {
            var input = JSON.parse(body);

            var page = this.retrievePage(input.tag);

            if (!page) {
                return;
            }

            page.name = input.name;
        })

        // Whenever a delete event is received, delete the corresponding note
        this.socket.on("deletepage", (pageID) => {
            this.removePage(pageID);
        })
    }

    /* Searches the notes array for a note
    @param noteID The id of the note to find
    @return a Note class instance with the given ID
    */
    retrieveNote(noteID: string) {
        for (var i:number = 0; i < this.notes.length; i++) {
            if (this.notes[i].id == noteID) {
                return this.notes[i];
            }
        }
        return null;

    }

    retrievePage(pageID: string) {
        for (var i: number = 0; i < this.notePages.length; i++) {
            if (this.notePages[i].pageID === pageID) {
                return this.notePages[i];
            }
        }
        return null;

    }

    // Directs the browser to the login page
    redirect() {
        this.router.navigate(['login']);
    }
}
