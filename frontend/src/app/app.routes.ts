import { Routes } from '@angular/router';
import { Games } from './games';

export const appRoutes: Routes = [
  { path: '', redirectTo: 'games', pathMatch: 'full' },
  { path: 'games', component: Games },
];
