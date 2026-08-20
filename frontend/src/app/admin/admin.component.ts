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
  isDeactivating = false;
  updatedGamesCount: number | null = null;
  deactivatedUsersCount: number | null = null;
  error: string | null = null;
  deactivateSuccessMessage: string | null = null;

  updateWinners(): void {
    if (this.isUpdating) return;

    this.isUpdating = true;
    this.updatedGamesCount = null;
    this.error = null;

    this.apiService.post('games/check-ended', {}).subscribe({
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

  deactivateAllUsers(): void {
    if (this.isDeactivating) return;
    if (
      !confirm(
        'Are you sure you want to set all users to inactive? Users will become active upon logging in.'
      )
    ) {
      return;
    }

    this.isDeactivating = true;
    this.deactivateSuccessMessage = null;
    this.error = null;

    this.apiService.post('user/deactivate-all', {}).subscribe({
      next: (result: { deactivatedCount: number }) => {
        this.deactivatedUsersCount = result.deactivatedCount;
        this.deactivateSuccessMessage = `Successfully deactivated ${result.deactivatedCount} users.`;
        this.isDeactivating = false;
      },
      error: (error: any) => {
        this.error =
          'Failed to deactivate users: ' + (error.message || 'Unknown error');
        console.error('Failed to deactivate users', error);
        this.isDeactivating = false;
      },
    });
  }
}
