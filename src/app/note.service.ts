import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError } from 'rxjs/operators';

import { Note } from './note';


const httpOptions = {
    headers: new HttpHeaders({
        'Content-Type': 'application/json'
    })
}

@Injectable({
  providedIn: 'root'
})
export class NoteService {

    notes: Note[] = [];
    dummyNotes: Note[] = [
        new Note("note-123", "test", 100, 100, 200, 200, ""),
        new Note("note-456", "test1", 200, 200, 30, 30, ""),
        new Note("note-789", "test2", 300, 300, 40, 40, "")
    ];


    constructor(private http: HttpClient) { }

    getNotes(): Observable<any> {
        return this.http.get<any>("/api", httpOptions)
            //.pipe(
            //catchError(this.handleError("Failed to retrieve notes."))
        //);
    }

    handleError(msg: String) {
        return (error: any): Observable<any> => {
            console.error(msg);

            return of({});
        };
    }
}
