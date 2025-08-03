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
              Make your predictions and compete with friends in the ultimate NFL picking game.
            </p>
          </div>

          <!-- Links Section -->
          <div class="footer-links">
            <div class="link-group">
              <h4 class="link-title">Game</h4>
              <a href="#" class="footer-link">How to Play</a>
              <a href="#" class="footer-link">Scoring</a>
              <a href="#" class="footer-link">Rules</a>
            </div>
            
            <div class="link-group">
              <h4 class="link-title">Support</h4>
              <a href="#" class="footer-link">Help Center</a>
              <a href="#" class="footer-link">Contact Us</a>
              <a href="#" class="footer-link">Bug Reports</a>
            </div>
            
            <div class="link-group">
              <h4 class="link-title">Legal</h4>
              <a href="#" class="footer-link">Privacy Policy</a>
              <a href="#" class="footer-link">Terms of Service</a>
              <a href="#" class="footer-link">Cookie Policy</a>
            </div>
          </div>
        </div>

        <!-- Bottom Section -->
        <div class="footer-bottom">
          <div class="footer-copyright">
            <span>&copy; 2025 NFL Pick 'Em. All rights reserved.</span>
          </div>
          
          <div class="footer-social">
            <span class="social-label text-sm">Follow us:</span>
            <div class="social-links">
              <a href="#" class="social-link" aria-label="Twitter">
                <span class="social-icon">🐦</span>
              </a>
              <a href="#" class="social-link" aria-label="Facebook">
                <span class="social-icon">📘</span>
              </a>
              <a href="#" class="social-link" aria-label="Instagram">
                <span class="social-icon">📷</span>
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  `,
  styleUrls: ['./footer.css'],
})
export class FooterComponent {}
