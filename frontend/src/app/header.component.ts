import { Component, inject } from '@angular/core';
import { AuthService } from './auth.service';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

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
              <span class="nav-icon">🎮</span>
              Games
            </a>
            <a routerLink="/leaderboard" routerLinkActive="active" class="nav-link">
              <span class="nav-icon">🏆</span>
              Leaderboard
            </a>
          </nav>

          <!-- User Section -->
          <div class="user-section" *ngIf="currentUser()">
            <!-- User Info -->
            <div class="user-info">
              <div class="user-avatar">
                <img *ngIf="currentUser()?.photoURL" [src]="currentUser()?.photoURL" [alt]="currentUser()?.displayName || 'User avatar'">
                <div *ngIf="!currentUser()?.photoURL" class="user-initial">
                  {{ getUserInitial() }}
                </div>
              </div>
              <div class="user-details">
                <span class="user-name">{{ currentUser()?.displayName || currentUser()?.email }}</span>
                <span class="user-status text-xs">Online</span>
              </div>
            </div>

            <!-- Logout Button -->
            <button 
              class="btn btn-secondary logout-btn" 
              (click)="logout()"
              [disabled]="isLoggingOut">
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
            [class.active]="isMobileMenuOpen">
            <span class="hamburger-line"></span>
            <span class="hamburger-line"></span>
            <span class="hamburger-line"></span>
          </button>
        </div>

        <!-- Mobile Navigation -->
        <nav class="mobile-nav" *ngIf="currentUser() && isMobileMenuOpen">
          <div class="mobile-nav-content">
            <a routerLink="/games" routerLinkActive="active" class="mobile-nav-link" (click)="closeMobileMenu()">
              <span class="nav-icon">🎮</span>
              Games
            </a>
            <a routerLink="/leaderboard" routerLinkActive="active" class="mobile-nav-link" (click)="closeMobileMenu()">
              <span class="nav-icon">🏆</span>
              Leaderboard
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
export class HeaderComponent {
  private authService = inject(AuthService);
  currentUser = () => this.authService.user;
  isLoggingOut = false;
  isMobileMenuOpen = false;

  getUserInitial(): string {
    const user = this.currentUser();
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
