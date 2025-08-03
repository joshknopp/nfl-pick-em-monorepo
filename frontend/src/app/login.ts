import { Component, inject } from '@angular/core';
import { AuthService } from './auth.service';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

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
  error = '';

  authService = inject(AuthService);

  async logout() {
    try {
      await this.authService.logout();
    } catch {
      this.error = 'Logout failed.';
    }
  }

  async loginWithGoogle() {
    try {
      await this.authService.loginWithGoogle();
    } catch {
      this.error = 'Google login failed.';
    }
  }

  async loginWithFacebook() {
    try {
      await this.authService.loginWithFacebook();
    } catch {
      this.error = 'Facebook login failed.';
    }
  }

  async loginWithEmail() {
    try {
      await this.authService.loginWithEmail(this.email, this.password);
    } catch {
      this.error = 'Email login failed.';
    }
  }

  async registerWithEmail() {
    try {
      await this.authService.registerWithEmail(this.email, this.password);
    } catch {
      this.error = 'Registration failed.';
    }
  }
}
