import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';

import { AppComponent } from './app.component';
import { NotePageComponent } from './note-page/note-page.component';
import { NoteComponent } from './note/note.component';
import { LoginComponent } from './login/login.component';
import { AppRoutingModule } from './/app-routing.module';
import { RightClickMenuComponent } from './right-click-menu/right-click-menu.component';
import { OptionsMenuComponent } from './options-menu/options-menu.component';
import { ChangelogComponent } from './changelog/changelog.component';

@NgModule({
  declarations: [
    AppComponent,
    NotePageComponent,
    NoteComponent,
    LoginComponent,
    RightClickMenuComponent,
    OptionsMenuComponent,
    ChangelogComponent
  ],
  imports: [
      BrowserModule,
      FormsModule,
      AppRoutingModule,
      HttpClientModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
