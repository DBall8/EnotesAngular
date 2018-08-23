export class UndoHandler {
    undoArray: string[] = [];
    undoEnd: number = 0;
    undoStart: number = 0;
    undoIntervalReady: boolean = true;
    undoIntervalID: number;

    constructor() {

    }

    popUndo() {
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

    pushUndo(str: string) {

        var prevStr;
        if (this.undoEnd <= 0) {
            prevStr = this.undoArray[MAXUNDO - 1];
        }
        else {
            prevStr = this.undoArray[this.undoEnd - 1];
        }

        if (prevStr === str) return;
        this.undoIntervalReady = false;

        this.undoArray[this.undoEnd] = str;
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

    undo() {
        var undoStr = this.popUndo();
        if (undoStr !== null) {
            var cursorStart = this.contentArea.nativeElement.selectionStart;
            var cursorEnd = this.contentArea.nativeElement.selectionEnd;

            var delta = this.note.content.length - undoStr.length;
            var newPos = cursorStart - delta;
            this.note.content = undoStr;

            setTimeout(() => {
                this.contentArea.nativeElement.selectionStart = newPos;
                this.contentArea.nativeElement.selectionEnd = newPos;
            });
        }
    }

    resetUndoTimer() {
        if (this.undoIntervalID) {
            window.clearInterval(this.undoIntervalID);
            this.setUndoInterval();
        }
    }

    setUndoInterval() {
        this.undoIntervalID = window.setInterval(() => {
            if (!this.undoIntervalReady) this.undoIntervalReady = true;
        }, UNDOTIME);
    }
};