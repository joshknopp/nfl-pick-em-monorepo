import { CommonModule } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { ApiService } from '../api.service';
import { AuthService } from '../auth.service';
import { GameDto } from 'libs';
import { WeekSelectorComponent } from '../week-selector/week-selector.component';

interface LeaderboardData {
  week: number;
  games: GameDto[];
  leaderboard: any[];
}

@Component({
  selector: 'app-leaderboard',
  standalone: true,
  imports: [CommonModule, WeekSelectorComponent],
  templateUrl: './leaderboard.html',
  styleUrls: ['./leaderboard.css'],
})
export class LeaderboardComponent implements OnInit {
  leaderboardData: LeaderboardData | null = null;
  isLoading = true;
  selectedWeek = 1;
  minWeek = 1;
  maxWeek = 1;
  currentUser: any;
  games: GameDto[] = [];

  private apiService = inject(ApiService);
  private authService = inject(AuthService);

  ngOnInit() {
    this.currentUser = this.authService.user;
    this.loadInitialData();
  }

  private loadInitialData() {
    this.isLoading = true;
    this.getGamesPromise()
      .then((games) => {
        this.games = games;
        this.setWeekBounds();
        this.selectedWeek = this.getInitialWeek();
        this.loadLeaderboard(); // Now load the leaderboard for the correct initial week
      })
      .catch((error) => {
        console.error('Error loading games:', error);
        this.isLoading = false; // Stop loading on error
      });
  }

  private getGamesPromise(): Promise<GameDto[]> {
    return new Promise((resolve, reject) => {
      this.apiService.get('games').subscribe({
        next: (games: GameDto[]) => {
          games.sort((a: GameDto, b: GameDto) => {
            if (a.season !== b.season) return a.season - b.season;
            if (a.week !== b.week) return a.week - b.week;
            return a.kickoffTime.localeCompare(b.kickoffTime);
          });
          resolve(games);
        },
        error: (err) => {
          console.error('Error in getGamesPromise:', err);
          reject(err);
        },
      });
    });
  }

  loadLeaderboard() {
    this.isLoading = true;
    this.apiService.get(`leaderboard?week=${this.selectedWeek}`).subscribe({
      next: (data: LeaderboardData) => {
        this.leaderboardData = data;
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading leaderboard:', error);
        this.isLoading = false;
      },
    });
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

  goToPreviousWeek() {
    if (this.selectedWeek > this.minWeek) {
      this.selectedWeek--;
      this.loadLeaderboard();
    }
  }

  goToNextWeek() {
    if (this.selectedWeek < this.maxWeek) {
      this.selectedWeek++;
      this.loadLeaderboard();
    }
  }

  // TODO move to a shared service
  getPickResult(
    pick: string,
    game: GameDto
  ): 'correct' | 'incorrect' | 'pending' {
    if (!game.winner) {
      return 'pending';
    }
    return pick === game.winner ? 'correct' : 'incorrect';
  }
}
