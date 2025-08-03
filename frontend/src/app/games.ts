import { CommonModule } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { ApiService } from './api.service';

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

  async ngOnInit() {
    try {
      this.games = await this.apiService.get('games');
    } catch (error) {
      console.error('Error fetching games:', error);
    }
  }
}
