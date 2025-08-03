import { CommonModule } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { ApiService } from './api.service';

import { GameDto } from 'libs';
type Game = GameDto;

interface GamePrediction {
  gameId: string;
  prediction: string;
}

@Component({
  selector: 'app-games',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './games.html',
  styleUrls: ['./games.css'],
})
export class GamesComponent implements OnInit {
  games: Game[] = [];
  predictions: Map<string, string> = new Map();

  private apiService = inject(ApiService);

  async ngOnInit() {
    try {
      this.games = await this.apiService.get('games');
    } catch (error) {
      console.error('Error fetching games:', error);
    }
  }

  // Helper methods for the template
  getGameId(game: Game): string {
    return `${game.awayTeam}-${game.homeTeam}-${game.week}`;
  }

  getTeamInitial(teamName: string): string {
    return teamName.charAt(0).toUpperCase();
  }

  getTeamAbbr(teamName: string): string {
    // Simple abbreviation logic - can be enhanced with actual team abbreviations
    const words = teamName.split(' ');
    if (words.length === 1) {
      return teamName.substring(0, 3).toUpperCase();
    }
    return words.map(word => word.charAt(0)).join('').toUpperCase();
  }

  getCurrentWeek(): number {
    if (this.games.length === 0) return 1;
    return Math.max(...this.games.map(game => game.week));
  }

  trackGame(index: number, game: Game): string {
    return this.getGameId(game);
  }

  onPredictionChange(game: Game, prediction: string): void {
    const gameId = this.getGameId(game);
    this.predictions.set(gameId, prediction);
    
    // Log for now - user mentioned they'll handle the saving logic later
    console.log(`Prediction for ${game.awayTeam} @ ${game.homeTeam}: ${prediction}`);
  }

  getPicksCount(): number {
    return this.predictions.size;
  }

  getPicksProgress(): number {
    if (this.games.length === 0) return 0;
    return (this.predictions.size / this.games.length) * 100;
  }
}
