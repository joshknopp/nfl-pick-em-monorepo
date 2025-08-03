import { Component } from '@angular/core';

@Component({
  selector: 'app-footer',
  standalone: true,
  template: `
    <footer class="site-footer">
      <span>&copy; 2025</span>
    </footer>
  `,
  styleUrls: ['./footer.css'],
})
export class FooterComponent {}
