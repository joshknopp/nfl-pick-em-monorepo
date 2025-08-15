import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../api.service';
import { AuthService } from '../auth.service';
import { firstValueFrom } from 'rxjs';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './settings.component.html',
  styleUrls: ['./settings.component.css'],
})
export class SettingsComponent implements OnInit {
  username = '';
  loading = true;
  saving = false;
  error = '';
  success = '';
  maxLen = 20;

  private apiService = inject(ApiService);
  private authService = inject(AuthService);

  ngOnInit() {
    this.loadUsername();
  }

  async loadUsername() {
    this.loading = true;
    this.error = '';
    this.success = '';
    const user = this.authService.user;
    if (!user) {
      this.error = 'Not logged in.';
      this.loading = false;
      return;
    }
    try {
      const res = await firstValueFrom(
        this.apiService.get(`users/${user.uid}/username`)
      );
      this.username = res?.username || '';
    } catch {
      this.error = 'Failed to load username.';
    }
    this.loading = false;
  }

  async saveUsername() {
    if (!this.username || this.username.length > this.maxLen) {
      this.error = `Username must be 1-${this.maxLen} characters.`;
      return;
    }
    this.saving = true;
    this.error = '';
    this.success = '';
    const user = this.authService.user;
    if (!user) {
      this.error = 'Not logged in.';
      this.saving = false;
      return;
    }
    try {
      await firstValueFrom(
        this.apiService.put(`users/${user.uid}/username`, {
          username: this.username,
        })
      );
      this.success = 'Username updated!';
    } catch {
      this.error = 'Failed to save username.';
    }
    this.saving = false;
  }
}
