import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError } from 'rxjs/operators';

import { Note } from './note';

const httpHeaders: HttpHeaders = new HttpHeaders({
    'Content-Type': 'application/json',
    'credentials': 'same-origin'
});

@Injectable({
  providedIn: 'root'
})
export class NoteService {

    DEBUG: boolean = false;
    socketID: String = "";

    notes: Note[] = [];
    dummyNotes = [
        new Note("note-123", "test", 100, 100, 200, 200, ""),
        new Note("note-456", "test1", 400, 400, 300, 300, ""),
        new Note("note-789", "test2", 800, 300, 400, 400, "")
    ];


    constructor(private http: HttpClient) { }

    loadSocket(socketID: String) {
        this.socketID = socketID;
    }

    getNotes(): Observable<any> {
        if (this.DEBUG) {
            return of(this.dummyNotes);
        }
        else {
            return this.http.request("GET", "/api", { observe: 'response', headers: httpHeaders })
        }
    }


    addNote(note: Note): Observable<any> {
        return this.http.request("POST", "/api", {
            observe: 'response', body: JSON.stringify({
            tag: note.id,
            content: note.content,
            x: note.x,
            y: note.y,
            width: note.width,
            height: note.height,
            zindex: note.zindex,
            colors: note.colors,
            socketid: this.socketID
         }),
            headers: httpHeaders
        });
    }

    updateNote(note: Note): Observable<any> {
        return this.http.request("PUT", "/api", {
            observe: 'response', body: JSON.stringify({
                tag: note.id,
                newcontent: note.content,
                newx: note.x,
                newy: note.y,
                newW: note.width,
                newH: note.height,
                newZ: note.zindex,
                newColors: note.colors,
                socketid: this.socketID
            }),
            headers: httpHeaders
        });
    }

    deleteNote(noteID: String): Observable<any> {
        return this.http.request("DELETE", "/api", {
            body: JSON.stringify({
                tag: noteID,
                socketID: this.socketID
            }),
            observe: 'response',
            headers: httpHeaders
        })
    }
}
