import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { HeaderComponent } from './header.component';
import { FooterComponent } from './footer.component';
import { ToastComponent } from './toast.component';
import { EnvironmentService } from './environment.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    HeaderComponent,
    FooterComponent,
    ToastComponent,
  ],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {
  protected title = 'frontend';
  private environmentService = inject(EnvironmentService);
  isDevelopment = this.environmentService.getEnvironmentName() !== 'production';
}
