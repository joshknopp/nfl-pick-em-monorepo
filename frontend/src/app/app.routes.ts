import { Routes } from '@angular/router';
import { AuthGuard } from './auth.guard';
import { GamesComponent } from './games';
import { LoginComponent } from './login';
import { LeaderboardComponent } from './leaderboard/leaderboard.component';
import { AdminComponent } from './admin/admin.component';
import { SettingsComponent } from './settings/settings.component';

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
    path: 'admin',
    canActivate: [AuthGuard],
    component: AdminComponent,
  },
  {
    path: 'settings',
    canActivate: [AuthGuard],
    component: SettingsComponent,
  },
  {
    path: 'login',
    component: LoginComponent,
  },
];
