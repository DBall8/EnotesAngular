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

    private popUndo() {
        this.resetUndoTimer();
        this.undoIntervalReady = true;

        if (this.undoEnd == this.undoStart) {
            return null;
        }

        if (this.undoEnd <= 0) {
            this.undoEnd = MAXUNDO;
        }
        this.undoEnd--;

        return this.undoArray[this.undoEnd];
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

        this.resetUndoTimer();

        //console.log(this.undoArray)
        //console.log("Start: " + this.undoStart + " End: " + this.undoEnd);
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