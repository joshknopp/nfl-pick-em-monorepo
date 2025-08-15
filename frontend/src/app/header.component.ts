import { Component, inject, OnInit } from '@angular/core';
import { AuthService } from './auth.service';
import { ApiService } from './api.service';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { firstValueFrom } from 'rxjs';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <header class="site-header">
      <div class="container">
        <div class="header-content">
          <!-- Logo and Brand -->
          <div class="brand">
            <div class="brand-icon">🏈</div>
            <h1 class="site-title">NFL Pick 'Em</h1>
          </div>

          <!-- Desktop Navigation -->
          <nav class="desktop-nav" *ngIf="currentUser()">
            <a routerLink="/games" routerLinkActive="active" class="nav-link">
              <span class="nav-icon">✅</span>
              Picks
            </a>
            <a
              routerLink="/leaderboard"
              routerLinkActive="active"
              class="nav-link"
            >
              <span class="nav-icon">🏆</span>
              Leaderboard
            </a>
            <a routerLink="/admin" routerLinkActive="active" class="nav-link">
              <span class="nav-icon">🛠️</span>
              Admin
            </a>
          </nav>

          <!-- User Section -->
          <div class="user-section" *ngIf="currentUser()">
            <!-- User Info -->
            <div class="user-info">
              <a
                class="user-avatar-link"
                routerLink="/settings"
                title="Settings"
              >
                <div class="user-avatar">
                  <img
                    *ngIf="currentUser()?.photoURL"
                    [src]="currentUser()?.photoURL"
                    [alt]="currentUser()?.displayName || 'User avatar'"
                  />
                  <div *ngIf="!currentUser()?.photoURL" class="user-initial">
                    {{ getUserInitial() }}
                  </div>
                </div>
                <div class="user-details">
                  <span class="user-name">
                    {{
                      username ||
                        currentUser()?.displayName ||
                        currentUser()?.email
                    }}</span
                  >
                </div>
              </a>
            </div>

            <!-- Logout Button -->
            <button
              class="btn btn-secondary logout-btn"
              (click)="logout()"
              [disabled]="isLoggingOut"
            >
              <span *ngIf="!isLoggingOut">Sign Out</span>
              <span *ngIf="isLoggingOut">
                <span class="spinner-sm"></span>
                Signing out...
              </span>
            </button>
          </div>

          <!-- Mobile Menu Button -->
          <button
            class="mobile-menu-btn"
            *ngIf="currentUser()"
            (click)="toggleMobileMenu()"
            [class.active]="isMobileMenuOpen"
          >
            <span class="hamburger-line"></span>
            <span class="hamburger-line"></span>
            <span class="hamburger-line"></span>
          </button>
        </div>

        <!-- Mobile Navigation -->
        <nav class="mobile-nav" *ngIf="currentUser() && isMobileMenuOpen">
          <div class="mobile-nav-content">
            <a
              routerLink="/games"
              routerLinkActive="active"
              class="mobile-nav-link"
              (click)="closeMobileMenu()"
            >
              <span class="nav-icon">🎮</span>
              Games
            </a>
            <a
              routerLink="/leaderboard"
              routerLinkActive="active"
              class="mobile-nav-link"
              (click)="closeMobileMenu()"
            >
              <span class="nav-icon">🏆</span>
              Leaderboard
            </a>
            <a
              routerLink="/admin"
              routerLinkActive="active"
              class="mobile-nav-link"
              (click)="closeMobileMenu()"
            >
              <span class="nav-icon">🛠️</span>
              Admin
            </a>
            <a
              routerLink="/settings"
              class="mobile-nav-link"
              (click)="closeMobileMenu()"
            >
              <span class="nav-icon">👤</span>
              Settings
            </a>
            <div class="mobile-nav-divider"></div>
            <button class="mobile-nav-link logout-link" (click)="logout()">
              <span class="nav-icon">🚪</span>
              Sign Out
            </button>
          </div>
        </nav>
      </div>
    </header>
  `,
  styleUrls: ['./header.css'],
})
export class HeaderComponent implements OnInit {
  private authService = inject(AuthService);
  private apiService = inject(ApiService);
  currentUser = () => this.authService.user;
  isLoggingOut = false;
  isMobileMenuOpen = false;
  username = '';

  ngOnInit() {
    firstValueFrom(this.authService.authReady$).then(() => {
      this.loadUsername();
    });
  }

  async loadUsername() {
    const currentUser = this.currentUser();
    if (!currentUser) {
      this.username = '';
      return;
    }
    try {
      const res = await firstValueFrom(this.apiService.get('user/username'));
      this.username =
        res?.username || currentUser.displayName || currentUser.email || '';
    } catch {
      this.username = '';
    }
  }

  getUserInitial(): string {
    const user = this.currentUser();
    if (this.username) {
      return this.username.charAt(0).toUpperCase();
    }
    if (user?.displayName) {
      return user.displayName.charAt(0).toUpperCase();
    }
    if (user?.email) {
      return user.email.charAt(0).toUpperCase();
    }
    return 'U';
  }

  toggleMobileMenu(): void {
    this.isMobileMenuOpen = !this.isMobileMenuOpen;
  }

  closeMobileMenu(): void {
    this.isMobileMenuOpen = false;
  }

  async logout(): Promise<void> {
    if (this.isLoggingOut) return;

    this.isLoggingOut = true;
    this.closeMobileMenu();

    try {
      await this.authService.logout();
    } catch (error: unknown) {
      console.error('Logout failed', error);
    } finally {
      this.isLoggingOut = false;
    }
  }
}
