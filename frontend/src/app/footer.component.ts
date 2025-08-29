import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [RouterModule],
  template: `
    <footer class="site-footer">
      <div class="container">
        <div class="footer-content">
          <!-- Brand Section -->
          <div class="footer-brand">
            <div class="footer-logo">
              <span class="logo-icon">🏈</span>
              <span class="logo-text">NFL Pick 'Em</span>
            </div>
            <p class="footer-description text-sm">
              Since, like, 2007 or something.
            </p>
          </div>

          <!-- Links Section -->
          <div class="footer-links">
            <div class="link-group"></div>

            <div class="link-group"></div>

            <div class="link-group">
              <a routerLink="/rules" class="footer-link">Rules</a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  `,
  styleUrls: ['./footer.css'],
})
export class FooterComponent {}
