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
  error: string | null = null;

  async updateWinners(): Promise<void> {
    if (this.isUpdating) return;

    this.isUpdating = true;
    this.updatedGamesCount = null;
    this.error = null;

    try {
      const result = await this.apiService.post<any[]>('/games/check-ended');
      this.updatedGamesCount = result.length;
    } catch (error: any) {
      this.error = 'Failed to update winners: ' + (error.message || 'Unknown error');
      console.error('Failed to update winners', error);
    } finally {
      this.isUpdating = false;
    }
  }
}
