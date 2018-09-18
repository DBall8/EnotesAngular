import { Component, OnInit, Input, ElementRef, ViewChild } from '@angular/core';

import { NoteService } from '../services/note.service';
import { ColorChart } from '../exports/ColorChart';

/* RightClickMenuComponent

Component for creating a custom right click menu for altering notes

*/

@Component({
  selector: 'app-right-click-menu',
  templateUrl: './right-click-menu.component.html',
  styleUrls: ['./right-click-menu.component.css']
})
export class RightClickMenuComponent implements OnInit {

    @Input() display; // Binds to an object that NotePage has to control how the menu is displayed

    @ViewChild('copy') copy: ElementRef;
    @ViewChild('paste') paste: ElementRef;

    colorChart: Object = ColorChart;
    fontSizes: number[] = [10, 12, 14, 18, 24, 32];
    fonts: string[] = ['Arial', 'Palatino Linotype', 'Courier New'];

    constructor(public noteService: NoteService) { 
    }

    ngOnInit() {
        this.copy.nativeElement.addEventListener('click', () => this.copyText());
        this.paste.nativeElement.addEventListener('click', () => this.pasteText());
    }

    // Loads the style from the display object
    private setStyle() {
        return {
		    'display': this.display.visible? 'block': 'none',
		    'left': this.display.x + 'px',
		    'top': this.display.y + 'px'
	    }
    }

    /* Opens a submenu depending on which menu option was selected
    @param e The click event that opened the menu
    @param option The name of the selected option
    */
    private selectOption(e, option) {
        e.stopPropagation();
        this.display.subMenu = option;
    }

    /* Selects a color for the note to become
    @param colorObj The object representing the color that was selected
    */
    private selectColor(colorObj) {
        this.display.note.colors = colorObj; // change the note's colors
        this.display.note.saved = false; // mark note as unsaved
        this.noteService.changesSaved = false;
    }

    private selectFontSize(size) {
        this.display.note.fontSize = size;
        this.display.note.saved = false;
        this.noteService.changesSaved = false;
    }

    private selectFont(font) {
        this.display.note.font = font;
        this.display.note.saved = false;
        this.noteService.changesSaved = false;
    }

    private moveNoteToPage(pageID: string) {
        if (!this.display.note) return;
        this.noteService.moveNoteToPage(this.display.note, pageID, true);
    }

    private getColors() {
        return Object.keys(this.colorChart);
    }

    private copyText() {
        var selBox = document.createElement('textarea');
        selBox.style.position = 'fixed';
        selBox.style.left = '0';
        selBox.style.top = '0';
        selBox.style.opacity = '0';
        selBox.value = this.display.text
        document.body.appendChild(selBox);
        selBox.focus();
        selBox.select();
        document.execCommand('copy');
        document.body.removeChild(selBox);
    }

    private pasteText() {
        window.alert("Please use the keyboard shortcut (Ctrl + v) to paste.");
    }

}
