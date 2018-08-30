import { NoteComponent } from '../note/note.component';

const MAXUNDO: number = 40;
const UNDOTIME: number = 2000; // time until a new undo state is saved in ms


// Interface for holding an undoable event
interface UndoObj {
    str: string, // the contents of the note to revert to
    note: NoteComponent, // the note component class to display the contents in
    inTitle: boolean
}


/**
        A class for handling a custom undo/redo queue
*/
export class UndoHandler {

    private undoArray: UndoObj[] = []; // circular queue of undoable actions
    private undoEnd: number = 0; // index of the next position to insert an undo
    private undoStart: number = 0; // the index of the farthest back undo-able action (beginning of circular queue)
    private redoEnd: number = 0; // the index of the next undo action to redo
    private undoIntervalReady: boolean = true; // true when the undoHandler is ready to save a new undo state
    private undoIntervalID: number; // the interval ID for canceling the undo timer

    constructor() {
        // start the undo interval on construction
        this.setUndoInterval();
    }

    /**
        Creates a new undo state that can be returned to
    */
    public track(str: string, note: NoteComponent, inTitle: boolean) {
        // If the enough time or actions have taken place since the last undo saved, save a new undo
        if (this.undoIntervalReady) {
            var newUndo: UndoObj = {
                str: str,
                note: note,
                inTitle: inTitle
            }
            this.pushUndo(newUndo);
        }
    }

    /**
        Undoes the last action in a note
    */
    public undo() {
        // get the last undo state
        var undoObj: UndoObj = this.popUndo();
        // if there is an available state, tell its note component to return to this state
        if (undoObj) undoObj.note.castUndo(undoObj.str, undoObj.inTitle);
    }

    /**
        Redoes the last action undone in a note
    */
    public redo() {
        // get the last undo action
        var undoObj: UndoObj = this.callRedo();
        // if there is an available state, tell the note component to return to it
        if (undoObj) undoObj.note.castUndo(undoObj.str, undoObj.inTitle);
    }

    /**
        Takes the last undo state from the circle queue, removes it, and returns it
    */
    private popUndo() {
        // reset the undo timer and makes the interval ready, so the next action saves an undo state
        this.resetUndoTimer();
        this.undoIntervalReady = true;

        // if the queue is empty, return nothing
        if (this.undoEnd == this.undoStart) {
            return null;
        }

        // save the index that would have had the next undo so that a redo can be saved here
        var undoIndex = this.undoEnd;

        // decrement the undoEnd index, making sure it loops back to the top when it goes below 0
        if (this.undoEnd <= 0) {
            this.undoEnd = MAXUNDO;
        }
        this.undoEnd--;

        // move the redoEnd index down if the undoEnd index collides into it
        if (this.undoEnd == this.redoEnd) this.redoEnd--;
        if (this.redoEnd < 0) this.redoEnd == MAXUNDO - 1; // make sure the redoEnd counter circles around the queue

        // get the undo state being popped
        var undoObj = this.undoArray[this.undoEnd];

        // save a redo state where the undoEnd index was before, with the note component's state before the undo
        var redoObj;
        if (undoObj.inTitle) {
            redoObj = { str: undoObj.note.note.title, note: undoObj.note, inTitle: undoObj.inTitle }
        } else {
            redoObj = { str: undoObj.note.note.content, note: undoObj.note, inTitle: undoObj.inTitle }
        }
        this.undoArray[undoIndex] = redoObj;

        return undoObj;
    }

    /**
        Adds a new undo state to the circular queue
    */
    private pushUndo(newUndo: UndoObj) {

        // reset the undo ready so as to not immediately get a new undo state
        this.undoIntervalReady = false;

        // save the new undo state
        this.undoArray[this.undoEnd] = newUndo;

        // increment the undoEnd index, ensuring it loops around at the end of the queue
        this.undoEnd++;
        if (this.undoEnd == MAXUNDO) {
            this.undoEnd = 0;
        }

        // If the end of the queue hits the beginning, move up the beginning ensuring it loops around
        if (this.undoEnd == this.undoStart) {
            this.undoStart++;
            if (this.undoStart >= MAXUNDO) {
                this.undoStart = 0;
            }
        }

        // set the redo index to the undo index
        this.redoEnd = this.undoEnd;

        // reset the timer so that another state is not just immediately set
        this.resetUndoTimer();
    }

    /** 
        Gets the next available redo state
    */
    private callRedo() {

        // If no undos have been called, there is nothting to redo, return nothing
        if (this.redoEnd == this.undoEnd) {
            return null;
        }

        // reset the undo timer to be ready for a new undo
        this.resetUndoTimer();
        this.undoIntervalReady = true;

        // save the index of the undoEnd for inserting a new undo state here
        var undoIndex = this.undoEnd;

        // incremenet the undo end index, ensuring it loops around the queue
        this.undoEnd++;
        if (this.undoEnd >= MAXUNDO) {
            this.undoEnd = 0;
        }

        // get the redo state object
        var undoObj = this.undoArray[this.undoEnd];
        // add a new undo state with the redone state's state so that this redone change can be undone again
        var redoObj;
        if (undoObj.inTitle) {
            redoObj = { str: undoObj.note.note.title, note: undoObj.note, inTitle: undoObj.inTitle }
        } else {
            redoObj = { str: undoObj.note.note.content, note: undoObj.note, inTitle: undoObj.inTitle }
        }
        this.undoArray[undoIndex] = redoObj;

        return undoObj;
    }

    /**
        Make the undoHandler ready to save a state on the next action
    */
    public readyUndo() {
        this.undoIntervalReady = true;
    }

    /**
        Resets the undo timer so as to start its period from the beginning again
    */
    private resetUndoTimer() {
        if (this.undoIntervalID) {
            window.clearInterval(this.undoIntervalID); // clear the old interval
            this.setUndoInterval(); // set a new interval
        }
    }

    /**
        Sets a timeout that sets the undo ready flag after the set amount of time
    */
    private setUndoInterval() {
        this.undoIntervalID = window.setTimeout(() => {
            if (!this.undoIntervalReady) this.undoIntervalReady = true;
        }, UNDOTIME);
    }
};