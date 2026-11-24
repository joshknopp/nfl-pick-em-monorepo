import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ApiService } from '../api.service';

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './admin.html',
  styleUrls: ['./admin.css'],
})
export class AdminComponent {
  private apiService = inject(ApiService);
  isUpdating = false;
  updatedGamesCount: number | null = null;
  isInvalidating = false;
  invalidationMessage: string | null = null;
  error: string | null = null;

  updateWinners(): void {
    if (this.isUpdating) return;

    this.isUpdating = true;
    this.updatedGamesCount = null;
    this.error = null;

    this.apiService.post('/games/check-ended', {}).subscribe({
      next: (result: any[]) => {
        this.updatedGamesCount = result.length;
        this.isUpdating = false;
      },
      error: (error: any) => {
        this.error = 'Failed to update winners: ' + (error.message || 'Unknown error');
        console.error('Failed to update winners', error);
        this.isUpdating = false;
      },
    });
  }

  invalidateCache(): void {
    if (this.isInvalidating) return;

    this.isInvalidating = true;
    this.invalidationMessage = null;
    this.error = null;

    this.apiService.post('games/invalidate-cache', {}).subscribe({
      next: () => {
        this.invalidationMessage = 'Cache invalidated successfully.';
        this.isInvalidating = false;
      },
      error: (error: unknown) => {
        const detail = error instanceof Error ? error.message : 'Unknown error';
        this.error = `Failed to invalidate cache: ${detail}`;
        console.error('Failed to invalidate cache', error);
        this.isInvalidating = false;
      },
    });
  }
}
