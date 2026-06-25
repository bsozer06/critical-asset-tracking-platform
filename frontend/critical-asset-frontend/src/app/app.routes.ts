import { Routes } from '@angular/router';
import { LoginComponent } from './components/login/login.component';
import { authGuard } from './guards/auth.guard';
import { App } from './app';

export const routes: Routes = [
  { path: 'login', component: LoginComponent },
  { path: '', component: App, canActivate: [authGuard] },
  { path: '**', redirectTo: '' }
];
