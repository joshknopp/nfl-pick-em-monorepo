import { CommonModule } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { ApiService } from '../api.service';
import { AuthService } from '../auth.service';
import { GameDto } from 'libs';

interface LeaderboardData {
  week: number;
  games: GameDto[];
  leaderboard: any[];
}

@Component({
  selector: 'app-leaderboard',
  standalone: true,
  imports: [CommonModule],
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

  private apiService = inject(ApiService);
  private authService = inject(AuthService);

  ngOnInit() {
    this.currentUser = this.authService.user();
    this.loadLeaderboard();
  }

  loadLeaderboard() {
    this.isLoading = true;
    this.apiService.get(`leaderboard?week=${this.selectedWeek}`).subscribe({
      next: (data: any) => {
        this.leaderboardData = data;
        this.setWeekBounds();
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading leaderboard:', error);
        this.isLoading = false;
      },
    });
  }

  setWeekBounds() {
    // This is a placeholder. I will implement this later.
    this.minWeek = 1;
    this.maxWeek = 18;
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

  getPickResult(
    pick: string,
    game: GameDto,
  ): 'correct' | 'incorrect' | 'pending' {
    if (!game.winner) {
      return 'pending';
    }
    if (!pick) {
      return 'pending';
    }
    return pick === game.winner ? 'correct' : 'incorrect';
  }
}
