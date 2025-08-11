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
    this.currentUser = this.authService.user;
    this.loadLeaderboard();
  }

  loadLeaderboard() {
    this.isLoading = true;
    this.apiService.get(`leaderboard?week=${this.selectedWeek}`).subscribe({
      next: (data: LeaderboardData) => {
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
    this.minWeek = 0;
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

  public getGameTooltip(game: GameDto): string {
    const kickoff = new Date(game.kickoffTime);
    const options: Intl.DateTimeFormatOptions = {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      hour: 'numeric',
      minute: 'numeric',
      hour12: true,
      timeZone: 'America/New_York',
    };

    const formatter = new Intl.DateTimeFormat('en-US', options);
    const parts = formatter.formatToParts(kickoff);

    const partValue = (type: string) =>
      parts.find((p) => p.type === type)?.value;

    const weekday = partValue('weekday');
    const month = partValue('month');
    const day = partValue('day');
    const hour = partValue('hour');
    const minute = partValue('minute');
    const dayPeriod = partValue('dayPeriod')?.toUpperCase();

    return `${weekday}, ${month} ${day}, ${hour}:${minute} ${dayPeriod} ET`;
  }
}
