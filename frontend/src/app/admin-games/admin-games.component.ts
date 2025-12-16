import { CommonModule, DOCUMENT } from '@angular/common';
import { Component, inject, OnDestroy, OnInit } from '@angular/core';
import { ApiService } from '../api.service';
import { WeekSelectorComponent } from '../week-selector/week-selector.component';
import { FormsModule } from '@angular/forms';

import { GameDto, serializeGame } from 'libs';
import { ToastService } from '../toast.service';
type Game = GameDto;

@Component({
  selector: 'app-admin-games',
  standalone: true,
  imports: [CommonModule, WeekSelectorComponent, FormsModule],
  templateUrl: './admin-games.html',
  styleUrls: ['./admin-games.css'],
})
export class AdminGamesComponent implements OnInit, OnDestroy {
  games: Game[] = [];
  filteredGames: Game[] = [];
  selectedWeek = 1;
  minWeek = 1;
  maxWeek = 1;
  isLoading = true;
  isSaving = new Map<string, boolean>();
  kickoffTimers = new Map<string, ReturnType<typeof setTimeout>>();
  editingGameId: string | null = null;
  newKickoffTime = '';

  private apiService = inject(ApiService);
  private toastService = inject(ToastService);
  private document = inject(DOCUMENT);

  ngOnInit() {
    this.loadGames();
    this.document.addEventListener(
      'visibilitychange',
      this.onVisibilityChange
    );
  }

  getGameId(dto: GameDto) {
    return serializeGame(dto);
  }

  private loadGames() {
    this.isLoading = true;
    this.getGamesPromise()
      .then((games) => {
        this.handleGamesLoaded(games);
        this.isLoading = false;
        this.filterGamesByWeek();
      })
      .catch((error) => {
        console.error('Error loading games:', error);
        this.isLoading = false;
      });
  }

  private getGamesPromise(): Promise<Game[]> {
    return new Promise((resolve, reject) => {
      this.apiService.get('games').subscribe({
        next: (games: Game[]) => {
          games.sort((a: Game, b: Game) => {
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

  private handleGamesLoaded(games: Game[]) {
    this.games = games;
    this.setWeekBounds();
    this.selectedWeek = this.getInitialWeek();
    this.resetAndSetKickoffTimers();
  }

  private resetAndSetKickoffTimers() {
    this.kickoffTimers.forEach((timer) => clearTimeout(timer));
    this.kickoffTimers.clear();

    this.games.forEach((game) => {
      const kickoffTime = new Date(game.kickoffTime).getTime();
      const now = new Date().getTime();
      if (kickoffTime > now) {
        const gameId = this.getGameId(game);
        const timeToKickoff = kickoffTime - now;
        const timer = setTimeout(() => {
          this.kickoffTimers.delete(gameId);
        }, timeToKickoff);
        this.kickoffTimers.set(gameId, timer);
      }
    });
  }

  getCurrentWeek(): number {
    if (this.games.length === 0) return 1;
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const upcomingWeeks = this.games
      .filter((game) => new Date(game.kickoffTime) >= now)
      .map((game) => game.week);
    if (upcomingWeeks.length === 0) {
      return Math.max(...this.games.map((game) => game.week));
    }
    return Math.min(...upcomingWeeks);
  }

  trackGame = (index: number, game: Game): string => {
    return serializeGame(game);
  };

  private onVisibilityChange = (): void => {
    if (this.document.visibilityState === 'visible') {
      this.resetAndSetKickoffTimers();
    }
  };

  ngOnDestroy(): void {
    this.kickoffTimers.forEach((timer) => clearTimeout(timer));
    this.document.removeEventListener(
      'visibilitychange',
      this.onVisibilityChange
    );
  }

  isGameLocked(game: Game): boolean {
    return new Date(game.kickoffTime) < new Date();
  }

  startEdit(game: Game): void {
    this.editingGameId = this.getGameId(game);
    // Format for datetime-local input
    const kickoff = new Date(game.kickoffTime);
    const timezoneOffset = kickoff.getTimezoneOffset() * 60000;
    const localTime = new Date(kickoff.getTime() - timezoneOffset);
    this.newKickoffTime = localTime.toISOString().slice(0, 16);
  }

  cancelEdit(): void {
    this.editingGameId = null;
  }

  saveKickoffTime(game: Game): void {
    const gameId = this.getGameId(game);
    this.isSaving.set(gameId, true);
    const newDate = new Date(this.newKickoffTime);
    this.apiService
      .patch(`games/${game.id}/kickoff`, { kickoffTime: newDate.toISOString() })
      .subscribe({
        next: (updatedGame: Game) => {
          const index = this.games.findIndex((g) => g.id === updatedGame.id);
          if (index !== -1) {
            this.games[index] = updatedGame;
            this.filterGamesByWeek();
          }
          this.isSaving.set(gameId, false);
          this.cancelEdit();
          this.toastService.show('Kickoff time updated successfully.', 'success');
        },
        error: (error: any) => {
          this.isSaving.set(gameId, false);
          console.error('Error updating kickoff time:', error);
          this.toastService.show('Failed to update kickoff time.', 'error');
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
    now.setHours(0, 0, 0, 0);
    const upcomingWeeks = this.games
      .filter((game) => new Date(game.kickoffTime) >= now)
      .map((game) => game.week);
    if (upcomingWeeks.length === 0) {
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
