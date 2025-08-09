import { CommonModule } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { ApiService } from './api.service';

import { GameDto, PickDTO, serializeGame } from 'libs';
import { PicksService } from './picks.service';
import { ToastService } from './toast.service';
type Game = GameDto;

interface GamePick {
  gameId: string;
  pickWinner: string;
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
  picks: Map<string, string> = new Map();
  filteredGames: Game[] = [];
  selectedWeek = 1;
  minWeek = 1;
  maxWeek = 1;
  isLoading = true;
  isSaving = new Map<string, boolean>();
  kickoffTimers = new Map<string, ReturnType<typeof setTimeout>>();

  private apiService = inject(ApiService);
  private picksService = inject(PicksService);
  private toastService = inject(ToastService);

  ngOnInit() {
    this.loadGamesAndPicks();
  }

  getGameId(dto: GameDto) {
    return serializeGame(dto);
  }

  private loadGamesAndPicks() {
    this.isLoading = true;
    Promise.all([this.getGamesPromise(), this.getUserPicksPromise()])
      .then(([games, picks]) => {
        this.handleGamesLoaded(games);
        this.handlePicksLoaded(picks);
        this.isLoading = false;
        this.filterGamesByWeek();
      })
      .catch((error) => {
        console.error('Error loading games or picks:', error);
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

  private getUserPicksPromise(): Promise<GamePick[]> {
    // Replace with actual picksService call
    return new Promise((resolve, reject) => {
      if (!this.picksService || !this.picksService.getUserPicks) {
        resolve([]);
        return;
      }
      const obs = this.picksService.getUserPicks();
      if (obs && typeof obs.subscribe === 'function') {
        obs.subscribe({
          next: (pickDtos: PickDTO[]) => {
            // Map PickDTO[] to GamePick[]
            const mapped = pickDtos.map((dto) => ({
              gameId: serializeGame(dto),
              pickWinner: dto.pickWinner,
            }));
            resolve(mapped);
          },
          error: reject,
        });
      } else {
        resolve([]);
      }
    });
  }

  private handleGamesLoaded(games: Game[]) {
    this.games = games;
    this.setWeekBounds();
    this.selectedWeek = this.getInitialWeek();
    this.games.forEach((game) => {
      const kickoffTime = new Date(game.kickoffTime).getTime();
      const now = new Date().getTime();
      if (kickoffTime > now) {
        const gameId = this.getGameId(game);
        const timeToKickoff = kickoffTime - now;
        const timer = setTimeout(() => {
          // This will trigger change detection and disable the game
          this.kickoffTimers.delete(gameId);
        }, timeToKickoff);
        this.kickoffTimers.set(gameId, timer);
      }
    });
  }

  private handlePicksLoaded(picks: GamePick[]) {
    // Preselect radio buttons for games with existing picks
    picks.forEach((pick) => {
      this.picks.set(pick.gameId, pick.pickWinner);
    });
  }

  getSelectedPick(game: Game): string | undefined {
    return this.picks.get(this.getGameId(game));
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
    return serializeGame(game);
  };

  ngOnDestroy(): void {
    // Clear all timers when the component is destroyed to prevent memory leaks
    this.kickoffTimers.forEach((timer) => clearTimeout(timer));
  }

  isGameLocked(game: Game): boolean {
    return new Date(game.kickoffTime) < new Date();
  }

  getPickResult(game: Game): 'correct' | 'incorrect' | 'pending' {
    if (!game.winner) {
      return 'pending';
    }
    const pick = this.getSelectedPick(game);
    if (!pick) {
      return 'pending';
    }
    return pick === game.winner ? 'correct' : 'incorrect';
  }

  onPickChange(game: Game, pick: string): void {
    const gameId = serializeGame(game);
    const oldPick = this.picks.get(gameId);
    this.picks.set(gameId, pick);
    this.isSaving.set(gameId, true);
    const pickDto: PickDTO = {
      season: game.season,
      week: game.week,
      homeTeam: game.homeTeam,
      awayTeam: game.awayTeam,
      pickWinner: pick,
    };
    this.picksService.saveUserPick(pickDto).subscribe({
      next: () => {
        this.isSaving.set(gameId, false);
      },
      error: (error) => {
        this.isSaving.set(gameId, false);
        console.error('Error saving user pick:', error, pickDto);
        this.toastService.show(
          `Failed to pick ${pickDto.pickWinner} for week ${pickDto.week}.`,
          'error'
        );
        if (oldPick) {
          this.picks.set(gameId, oldPick);
        } else {
          this.picks.delete(gameId);
        }
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
