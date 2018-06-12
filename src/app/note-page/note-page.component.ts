import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';

import { NoteService } from '../note.service';
import { Note } from '../note';

@Component({
  selector: 'app-note-page',
  templateUrl: './note-page.component.html',
  styleUrls: ['./note-page.component.css']
})
export class NotePageComponent implements OnInit {

    notes: Note[] = [];

    resize = {
        note: null,
        startX: 0,
        startY: 0,
        startW: 0,
        startH: 0
    };
    drag = {
        note: null,
        offsetX: 0,
        offsetY: 0
    };

    constructor(private noteService: NoteService, private router: Router) {
    }

    ngOnInit() {
        window.addEventListener("mousemove", (e) => this.mouseMove(e));
        window.addEventListener("mouseup", (e) => this.mouseUp(e));

        this.noteService.getNotes().subscribe((res) => {
            if (res.sessionExpired || !res.successful) {
                this.router.navigate(['login']);
                return;
            }

            this.loadNotes(res.notes);

        }, (error) => console.error(error.error));
    }

    loadNotes(ns: any[]) {
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

            var note:Note = new Note(anote.tag, anote.content, anote.x, anote.y, anote.width, anote.height, colors);
            //n.zindex = anote.zindex;
            this.notes.push(note);
            return;
        });
    }

    mouseMove(e: MouseEvent){
        if (this.drag.note) {
            this.drag.note.x = e.clientX - this.drag.offsetX;
            this.drag.note.y = e.clientY - this.drag.offsetY;
        }
        if (this.resize.note) {
            this.resize.note.width = this.resize.startW + e.clientX - this.resize.startX;
            this.resize.note.height = this.resize.startH + e.clientY - this.resize.startY;
        }
    }

    mouseUp(e: MouseEvent) {
        if (this.resize.note) {
            this.resize.note.width = this.resize.startW + e.clientX - this.resize.startX;
            this.resize.note.height = this.resize.startH + e.clientY - this.resize.startY;
            this.resetResize();
        }
        if (this.drag.note) {
            this.drag.note.x = e.clientX - this.drag.offsetX;
            this.drag.note.y = e.clientY - this.drag.offsetY;
            this.resetDrag();
        }
    }

    noteDragStart(event) {
        var note: Note = this.retrieveNote(event.noteID);
        this.drag = {
            note: note,
            offsetX: event.x - note.x,
            offsetY: event.y - note.y
        }
    }

    noteResizeStart(event) {
        var note: Note = this.retrieveNote(event.noteID);
        this.resize = {
            note: note,
            startX: event.x,
            startY: event.y,
            startW: note.width,
            startH: note.height
        }
        console.log(this.resize)
    }

    retrieveNote(noteID: String) {
        for (var i:number = 0; i < this.notes.length; i++) {
            if (this.notes[i].id == noteID) {

                return this.notes[i];
            }
        }
        return null;

    }

    resetResize() {
        this.resize = {
            note: null,
            startX: 0,
            startY: 0,
            startW: 0,
            startH: 0
        };
        
    }

    resetDrag() {
        this.drag = {
            note: null,
            offsetX: 0,
            offsetY: 0
        };
    }

}
