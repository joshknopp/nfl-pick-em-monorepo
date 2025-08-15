import { Component, inject, OnDestroy, OnInit } from '@angular/core';
import { AuthService } from './auth.service';
import { ApiService } from './api.service';
import { UserService } from './user.service';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { firstValueFrom, Subscription } from 'rxjs';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './header.component.html',
  styleUrls: ['./header.css'],
})
export class HeaderComponent implements OnInit, OnDestroy {
  private authService = inject(AuthService);
  private apiService = inject(ApiService);
  private userService = inject(UserService);
  currentUser = () => this.authService.user;
  isLoggingOut = false;
  isMobileMenuOpen = false;
  username = '';
  private displayNameSub?: Subscription;
  private authSub?: Subscription;

  ngOnInit() {
    firstValueFrom(this.authService.authReady$).then(() => {
      this.loadUsername();
      this.displayNameSub = this.userService.displayName$.subscribe((name) => {
        if (name) {
          this.username = name;
        }
      });
      this.authSub = this.authService.isAuthenticated$.subscribe(() => {
        this.loadUsername();
      });
    });
  }
  ngOnDestroy() {
    this.displayNameSub?.unsubscribe();
    this.authSub?.unsubscribe();
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
