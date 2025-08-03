import { CommonModule } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { ApiService } from './api.service';
import { AuthService } from './auth.service';
import { UserService } from './user.service';

import { GameDto } from 'libs';
type Game = GameDto;

@Component({
  selector: 'app-games',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './games.html',
  styleUrls: ['./games.css'],
})
export class GamesComponent implements OnInit {
  games: Game[] = [];

  private apiService = inject(ApiService);
  private userService = inject(UserService);
  private auth = inject(AuthService);

  async ngOnInit() {
    const userDetails = await this.userService.getUserDetails();
    console.log('User details:', userDetails);

    try {
      const token = this.auth.getToken() ?? undefined;
      const games = await this.apiService.get('games', { token });
      this.games = games;
    } catch (error) {
      console.error('Error fetching games:', error);
    }
  }

  // TODO move to main layout
  logout() {
    this.auth.logout();
  }
}
