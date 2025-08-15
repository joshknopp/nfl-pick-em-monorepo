import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../api.service';
import { AuthService } from '../auth.service';
import { UserService } from '../user.service';
import { firstValueFrom } from 'rxjs';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './settings.component.html',
  styleUrls: ['./settings.component.css'],
})
export class SettingsComponent implements OnInit {
  displayName = '';
  loading = true;
  saving = false;
  error = '';
  success = '';
  minLength = 3;
  maxLength = 20;

  private apiService = inject(ApiService);
  private authService = inject(AuthService);
  private userService = inject(UserService);

  ngOnInit() {
    this.loadDisplayName();
  }

  async loadDisplayName() {
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
      const res = await firstValueFrom(this.apiService.get('user/username'));
      if (res?.username) {
        this.displayName = res.username;
      } else {
        this.displayName = user.displayName || user.email || '';
      }
    } catch {
      this.error = 'Failed to load displayName.';
    }
    this.loading = false;
  }

  async saveDisplayName() {
    if (
      !this.displayName ||
      this.displayName.length < this.minLength ||
      this.displayName.length > this.maxLength
    ) {
      this.error = `Display Name must be ${this.minLength}-${this.maxLength} characters.`;
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
        this.apiService.put('user/username', {
          username: this.displayName,
        })
      );
      this.success = 'Display name updated!';
      this.userService.setDisplayName(this.displayName);
    } catch {
      this.error = 'Failed to save disply name.';
    }
    this.saving = false;
  }
}
