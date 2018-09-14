import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { NotePageComponent } from './note-page/note-page.component';
import { LoginComponent } from './login/login.component';
import { ChangelogComponent } from './changelog/changelog.component';
import { HelpPageComponent } from './help-page/help-page.component';

const routes: Routes = [
    { path: '', component: NotePageComponent },
    { path: 'login', component: LoginComponent },
    { path: 'changelog', component: ChangelogComponent },
    { path: 'help', component: HelpPageComponent },
    { path: '', redirectTo: '/', pathMatch: 'prefix' },
    ]

@NgModule({
    exports: [RouterModule],
    imports: [RouterModule.forRoot(routes)]
})
export class AppRoutingModule {
}
