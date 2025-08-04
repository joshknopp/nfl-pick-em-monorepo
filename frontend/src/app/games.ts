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
  filteredGames: Game[] = [];
  selectedWeek = 1;
  minWeek = 1;
  maxWeek = 1;

  private apiService = inject(ApiService);

  ngOnInit() {
    this.apiService.get('games').subscribe({
      next: (games: Game[]) => {
        games.sort((a: Game, b: Game) => {
          if (a.season !== b.season) return a.season - b.season;
          if (a.week !== b.week) return a.week - b.week;
          return a.kickoffTime.localeCompare(b.kickoffTime);
        });
        this.games = games;
        this.setWeekBounds();
        this.selectedWeek = this.getInitialWeek();
        this.filterGamesByWeek();
      },
      error: (error) => {
        console.error('Error fetching games:', error);
      },
    });
  }

  getGameId(game: Game): string {
    const season = game.season;
    const week = String(game.week).padStart(2, '0');
    const away = game.awayTeam.toLowerCase();
    const home = game.homeTeam.toLowerCase();
    return `${season}-${week}-${away}-at-${home}`;
  }

  getCurrentWeek(): number {
    if (this.games.length === 0) return 1;
    const now = new Date();
    now.setHours(0, 0, 0, 0); // Today's date at 00:00
    // Find all weeks with games scheduled for today or later
    const upcomingWeeks = this.games
      .filter((game) => new Date(game.kickoffTime) >= now)
      .map((game) => game.week);
    if (upcomingWeeks.length === 0) {
      // If no upcoming games, fallback to max week
      return Math.max(...this.games.map((game) => game.week));
    }
    return Math.min(...upcomingWeeks);
  }

  trackGame = (index: number, game: Game): string => {
    return this.getGameId(game);
  };

  onPredictionChange(game: Game, prediction: string): void {
    const gameId = this.getGameId(game);
    this.predictions.set(gameId, prediction);

    // Log for now - user mentioned they'll handle the saving logic later
    console.log(`Picked ${prediction} for ${this.getGameId(game)}`);
  }

  setWeekBounds() {
    if (this.games.length === 0) {
      this.minWeek = 1;
      this.maxWeek = 1;
      return;
    }
    this.minWeek = Math.min(...this.games.map((g) => g.week));
    this.maxWeek = Math.max(...this.games.map((g) => g.week));
  }

  getInitialWeek(): number {
    if (this.games.length === 0) return 1;
    const now = new Date();
    now.setHours(0, 0, 0, 0); // Today's date at 00:00
    // Find all weeks with games scheduled for today or later
    const upcomingWeeks = this.games
      .filter((game) => new Date(game.kickoffTime) >= now)
      .map((game) => game.week);
    if (upcomingWeeks.length === 0) {
      // If no upcoming games, fallback to max week
      return Math.max(...this.games.map((game) => game.week));
    }
    return Math.min(...upcomingWeeks);
  }

  filterGamesByWeek() {
    this.filteredGames = this.games.filter((g) => g.week === this.selectedWeek);
  }

  goToPreviousWeek() {
    if (this.selectedWeek > this.minWeek) {
      this.selectedWeek--;
      this.filterGamesByWeek();
    }
  }

  goToNextWeek() {
    if (this.selectedWeek < this.maxWeek) {
      this.selectedWeek++;
      this.filterGamesByWeek();
    }
  }
}
