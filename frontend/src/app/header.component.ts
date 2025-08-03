import { Component, inject } from '@angular/core';
import { AuthService } from './auth.service';

@Component({
  selector: 'app-header',
  standalone: true,
  template: `
    <header class="site-header">
      <div class="header-content">
        <h1 class="site-title">NFL Pick 'Em</h1>
        <button class="logout-btn" (click)="logout()">Logout</button>
      </div>
    </header>
  `,
  styleUrls: ['./header.css'],
})
export class HeaderComponent {
  private authService = inject(AuthService);

  logout() {
    this.authService.logout().catch((error: unknown) => {
      console.error('Logout failed', error);
    });
  }
}
