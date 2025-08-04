import { Component, inject } from '@angular/core';
import { AuthService } from './auth.service';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

type AuthMode = 'login' | 'register';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule, CommonModule],
  templateUrl: './login.html',
  styleUrls: ['./login.css'],
})
export class LoginComponent {
  email = '';
  password = '';
  confirmPassword = '';
  error = '';
  successMessage = '';
  isLoading = false;
  authMode: AuthMode = 'login';

  authService = inject(AuthService);

  setAuthMode(mode: AuthMode): void {
    this.authMode = mode;
    this.clearMessages();
    // Clear confirm password when switching to login
    if (mode === 'login') {
      this.confirmPassword = '';
    }
  }

  isFormValid(): boolean {
    if (!this.email || !this.password) {
      return false;
    }
    
    if (this.authMode === 'register') {
      return this.password.length >= 6 && 
             this.confirmPassword === this.password;
    }
    
    return this.password.length >= 6;
  }

  clearMessages(): void {
    this.error = '';
    this.successMessage = '';
  }

  async submitEmailAuth(): Promise<void> {
    if (!this.isFormValid() || this.isLoading) {
      return;
    }

    this.isLoading = true;
    this.clearMessages();

    try {
      if (this.authMode === 'login') {
        await this.loginWithEmail();
      } else {
        await this.registerWithEmail();
      }
    } catch (error: any) {
      this.handleAuthError(error);
    } finally {
      this.isLoading = false;
    }
  }

  async loginWithGoogle(): Promise<void> {
    if (this.isLoading) return;
    
    this.isLoading = true;
    this.clearMessages();

    try {
      await this.authService.loginWithGoogle();
      this.successMessage = 'Successfully signed in with Google!';
    } catch (error: any) {
      this.handleAuthError(error);
    } finally {
      this.isLoading = false;
    }
  }

  async loginWithFacebook(): Promise<void> {
    if (this.isLoading) return;
    
    this.isLoading = true;
    this.clearMessages();

    try {
      await this.authService.loginWithFacebook();
      this.successMessage = 'Successfully signed in with Facebook!';
    } catch (error: any) {
      this.handleAuthError(error);
    } finally {
      this.isLoading = false;
    }
  }

  async loginWithEmail(): Promise<void> {
    await this.authService.loginWithEmail(this.email, this.password);
    this.successMessage = 'Successfully signed in!';
  }

  async registerWithEmail(): Promise<void> {
    if (this.password !== this.confirmPassword) {
      throw new Error('Passwords do not match');
    }
    
    await this.authService.registerWithEmail(this.email, this.password);
    this.successMessage = 'Account created successfully! You are now signed in.';
  }

  async logout(): Promise<void> {
    if (this.isLoading) return;
    
    this.isLoading = true;
    this.clearMessages();

    try {
      await this.authService.logout();
      this.successMessage = 'Successfully signed out!';
    } catch (error: any) {
      this.handleAuthError(error);
    } finally {
      this.isLoading = false;
    }
  }

  showForgotPassword(): void {
    // This would typically show a forgot password modal or navigate to a forgot password page
    // For now, we'll just show a message
    this.successMessage = 'Forgot password functionality will be implemented soon. Please contact support if needed.';
  }

  private handleAuthError(error: any): void {
    let errorMessage = 'An unexpected error occurred. Please try again.';
    
    if (error?.code) {
      switch (error.code) {
        case 'auth/user-not-found':
        case 'auth/wrong-password':
          errorMessage = 'Invalid email or password.';
          break;
        case 'auth/email-already-in-use':
          errorMessage = 'An account with this email already exists.';
          break;
        case 'auth/weak-password':
          errorMessage = 'Password should be at least 6 characters long.';
          break;
        case 'auth/invalid-email':
          errorMessage = 'Please enter a valid email address.';
          break;
        case 'auth/too-many-requests':
          errorMessage = 'Too many failed attempts. Please try again later.';
          break;
        case 'auth/network-request-failed':
          errorMessage = 'Network error. Please check your connection and try again.';
          break;
        default:
          errorMessage = error.message || errorMessage;
      }
    } else if (error?.message) {
      errorMessage = error.message;
    }
    
    this.error = errorMessage;
  }
}
