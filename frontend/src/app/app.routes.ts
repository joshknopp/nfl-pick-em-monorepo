import { Routes } from '@angular/router';
import { AuthGuard } from './auth.guard';
import { GamesComponent } from './games';
import { LoginComponent } from './login';

export const appRoutes: Routes = [
  { path: '', redirectTo: 'games', pathMatch: 'full' },
  {
    path: 'games',
    canActivate: [AuthGuard],
    component: GamesComponent,
  },
  {
    path: 'login',
    component: LoginComponent,
  },
];
