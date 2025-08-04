import { Component } from '@angular/core';

@Component({
  selector: 'app-footer',
  standalone: true,
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
              <h4 class="link-title">Game</h4>
              <a href="#" class="footer-link">Rules</a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  `,
  styleUrls: ['./footer.css'],
})
export class FooterComponent {}
