import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { environment } from '../environments/environment';
import { AuthService } from './auth.service';

interface Game {
  homeTeam: string;
  awayTeam: string;
  week: number;
  date: string;
}

@Component({
  selector: 'app-games',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './games.html',
  styleUrls: ['./games.css'],
})
export class GamesComponent implements OnInit {
  games: Game[] = [];

  private http = inject(HttpClient);
  auth = inject(AuthService);

  async ngOnInit() {
    const userDetails = await this.auth.getUserDetails();
    console.log('User details:', userDetails);

    this.http.get<Game[]>(`${environment.apiUrl}/games`).subscribe(
      (data: Game[]) => {
        this.games = data;
      },
      (error) => {
        console.error('Error fetching games:', error);
      }
    );
  }
}
