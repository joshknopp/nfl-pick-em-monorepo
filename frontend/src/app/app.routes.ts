import { Routes } from '@angular/router';
import { AuthGuard } from './auth.guard';
import { GamesComponent } from './games';
import { LoginComponent } from './login';
import { LeaderboardComponent } from './leaderboard/leaderboard.component';

export const appRoutes: Routes = [
  { path: '', redirectTo: 'games', pathMatch: 'full' },
  {
    path: 'games',
    canActivate: [AuthGuard],
    component: GamesComponent,
  },
  {
    path: 'leaderboard',
    canActivate: [AuthGuard],
    component: LeaderboardComponent,
  },
  {
    path: 'login',
    component: LoginComponent,
  },
];
