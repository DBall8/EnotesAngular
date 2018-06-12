import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { NotePageComponent } from './note-page/note-page.component';
import { LoginComponent } from './login/login.component';


const routes: Routes = [
    { path: 'login', component: LoginComponent },
    { path: '**', component: NotePageComponent },
    ]

@NgModule({
    exports: [RouterModule],
    imports: [RouterModule.forRoot(routes)]
})
export class AppRoutingModule {
}
