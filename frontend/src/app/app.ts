import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { LoginComponent } from './login';
import { GamesComponent } from './games';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [FormsModule, RouterModule, LoginComponent, GamesComponent],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {
  protected title = 'frontend';
}
