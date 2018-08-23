import { NoteComponent } from '../note/note.component';

const MAXUNDO: number = 40;
const UNDOTIME: number = 2000; // time until a new undo state is saved in ms

interface UndoObj {
    str: string,
    note: NoteComponent
}

export class UndoHandler {

    private undoArray: UndoObj[] = [];
    private undoEnd: number = 0;
    private undoStart: number = 0;
    private redoEnd: number = -1;
    private undoIntervalReady: boolean = true;
    private undoIntervalID: number;

    constructor() {
        this.setUndoInterval();
    }

    public track(str: string, note: NoteComponent) {
        if (this.undoIntervalReady) {
            var newUndo: UndoObj = {
                str: str,
                note: note
            }
            this.pushUndo(newUndo);
        }
    }

    public undo() {
        var undoObj: UndoObj = this.popUndo();
        if (undoObj) undoObj.note.castUndo(undoObj.str);
    }

    public redo() {
        var undoObj: UndoObj = this.callRedo();
        if (undoObj) undoObj.note.castUndo(undoObj.str);
    }

    private popUndo() {
        this.resetUndoTimer();
        this.undoIntervalReady = true;

        if (this.undoEnd == this.undoStart) {
            return null;
        }

        var saveUndo = false;

        if (this.undoEnd == this.redoEnd) {
            saveUndo = true;
        }

        if (this.undoEnd <= 0) {
            this.undoEnd = MAXUNDO;
        }
        this.undoEnd--;

        if (this.undoEnd == this.redoEnd) this.redoEnd--;
        if (this.redoEnd < 0) this.redoEnd == MAXUNDO - 1;

        var undoObj = this.undoArray[this.undoEnd];

        if (saveUndo) {
            this.undoArray[this.redoEnd] = { str: undoObj.note.note.content, note: undoObj.note }
        }

        return undoObj;
    }

    private pushUndo(newUndo: UndoObj) {
        /*
        var prevStr;
        if (this.undoEnd <= 0) {
            prevStr = this.undoArray[MAXUNDO - 1];
        }
        else {
            prevStr = this.undoArray[this.undoEnd - 1];
        }

        if (prevStr === str) return;
*/
        this.undoIntervalReady = false;

        this.undoArray[this.undoEnd] = newUndo;
        this.undoEnd++;
        if (this.undoEnd == MAXUNDO) {
            this.undoEnd = 0;
        }
        if (this.undoEnd == this.undoStart) {
            this.undoStart++;
            if (this.undoStart >= MAXUNDO) {
                this.undoStart = 0;
            }
        }

        this.redoEnd = this.undoEnd;

        this.resetUndoTimer();

        //console.log(this.undoArray)
        //console.log("Start: " + this.undoStart + " End: " + this.undoEnd);
    }

    private callRedo() {
        if (this.redoEnd == this.undoEnd) {
            return null;
        }

        this.resetUndoTimer();
        this.undoIntervalReady = true;

        this.undoEnd++;
        if (this.undoEnd >= MAXUNDO) {
            this.undoEnd = 0;
        }

        return this.undoArray[this.undoEnd];
    }

    public readyUndo() {
        this.undoIntervalReady = true;
    }

    private resetUndoTimer() {
        if (this.undoIntervalID) {
            window.clearInterval(this.undoIntervalID);
            this.setUndoInterval();
        }
    }

    private setUndoInterval() {
        this.undoIntervalID = window.setInterval(() => {
            if (!this.undoIntervalReady) this.undoIntervalReady = true;
        }, UNDOTIME);
    }
};