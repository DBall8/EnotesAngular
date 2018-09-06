import { Component, OnInit } from '@angular/core';

import { NoteService } from '../services/note.service';
import { NotePage } from '../classes/notePage';

interface DragObj{
    page: NotePage,
    tab: any,
    center: number
}

@Component({
  selector: 'app-tab-bar',
  templateUrl: './tab-bar.component.html',
  styleUrls: ['./tab-bar.component.css']
})
export class TabBarComponent implements OnInit {

    drag: DragObj = null;
    tabElements: any;

    constructor(public noteService: NoteService) { }

    ngOnInit() {
        window.addEventListener("mouseup", (e) => {
            this.endDrag();
        });

        window.addEventListener("mousemove", (e) => {
            if (this.drag) {
                this.drag.tab.style.left = e.screenX - this.drag.center  + 'px';
                // loop through all tabs, except the last (the add tab tab)
                for (var i = 0; i < this.tabElements.length-1; i++) {
                    if (this.drag.tab != this.tabElements[i]) {
                        var tabCenter = this.tabElements[i].offsetLeft + (this.tabElements[i].offsetWidth / 2);
                        // dragging left
                        if (e.clientX < this.drag.center) {
                            if (e.clientX < tabCenter && tabCenter < this.drag.center) {
                                this.drag.center = this.tabElements[i].offsetLeft + this.tabElements[i].offsetWidth / 2;
                                this.noteService.swapPagePositions(this.drag.page.index, i);
                            }
                        }
                        // dragging right
                        else {
                            if (e.clientX > tabCenter && tabCenter > this.drag.center) {
                                this.drag.center = this.tabElements[i].offsetLeft + this.tabElements[i].offsetWidth / 2;
                                this.noteService.swapPagePositions(this.drag.page.index, i);
                                
                            }
                        }
                    }
                }
            }
        });
  }

    /*
        Called when a page tab is clicked on. Switched to that page
    */
    tabClick(page) {
        this.noteService.selectNotePage(page.pageID);
    }

    /*
        Called when a mouse is pressed on a page tab. Prevents the text from being highlighted if not editing the tab name
    */
    tabMouseDown(e, page: NotePage) {
        if (!e.target.highlight) {
            e.preventDefault();
        }

        this.startDrag(e.target, page);
    }

    /*
        Filters the input into the tab name. Prevents newlines and text longer than 100 characters
    */
    filterKeys(e, page) {
        // override the enter key to simply stop editing the name
        if (e.key == 'Enter') {
            e.preventDefault();
            this.blurTab(e.target, page);
        }
        // Cap length at 100
        else if (e.target.textContent.length >= 100 && e.key !== 'Delete' && e.key != 'Backspace') {
            // If the name is max length and a non delete key was pressed, check if anything is highlighted
            var range = window.getSelection().getRangeAt(0);
            var cursorStart = range.startOffset;
            var cursorEnd = range.endOffset;

            // if nothing highlighted, prevent input
            if (cursorEnd - cursorStart <= 0) {
                e.preventDefault();
            }

            // if text somehow got longer than 100 characters, chop off the end
            if (e.target.textContent.length > 100) {
                e.target.textContent = e.target.textContent.substring(0, 101);
            }
        }


    }

    /*
        Called on input to page name. Double checks there are no invalid characters and removes any found
    */
    filterInputs(e) {
        // if a new line somehow got in, remove it (moves cursor position so only do if needed)
        if (e.target.textContent.indexOf(/\n/g) > -1) {
            e.target.textContent = e.target.textContent.replace(/\n/g, "");
        }
    }

    editTab(e, target, length) {
        if (!target) return;
        target.contentEditable = true;
        target.highlight = true;
        target.focus();

        // dont select anything if there is nothing to select
        if (length <= 0) return;

        var range;

        if (typeof document.createRange != "undefined") {
            if (typeof e.rangeParent != "undefined") {
                range = document.createRange();
                range.setStart(e.rangeParent, 0);
                range.setEnd(e.rangeParent, length);
            }
        }

        if (range) {
            if (typeof range.select != "undefined") {
                range.select();
            } else if (typeof window.getSelection != "undefined") {
                var sel = window.getSelection();
                sel.removeAllRanges();
                sel.addRange(range);
            }
        }

    }

    blurTab(target, page) {
        target.contentEditable = false;
        target.highlight = false;
        //target.setAttribute("disabled");
        page.name = target.textContent;
        this.noteService.updateNotePage(page);
        target.textContent = page.name;
    }

    addTab() {
        this.noteService.addNotePage("");
    }

    deleteTab(page) {
        if (window.confirm("Are you sure you want to delete this page? WARNING: All notes on this page will be deleted and cannot be recovered.")) {
            this.noteService.deleteNotePage(page.pageID);
        }
    }

    startDrag(tab, page:NotePage) {
        if (tab.className === "innerTab") {
            tab = tab.parentElement;
        }
        this.drag = {
            page: page,
            tab: tab,
            center: tab.offsetLeft + tab.offsetWidth/2
        }
        this.drag.tab.style.position = 'relative';
        //this.drag.tab.position = 'relative';
        this.tabElements = document.getElementsByClassName("tab");
    }

    endDrag() {
        if (this.drag) {
            this.drag.tab.style.position = 'static'
            this.drag.tab.style.left = '0px';
            this.drag = null;
            //this.noteService.reIndexPages();
        }
    }

}
