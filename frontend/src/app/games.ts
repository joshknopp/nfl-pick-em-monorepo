import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common'; // Import CommonModule
import { HttpClient } from '@angular/common/http'; // Import HttpClient
import { environment } from '../environments/environment';

interface Game {
  homeTeam: string;
  awayTeam: string;
  week: number;
  date: string;
}

@Component({
  selector: 'app-games',
  standalone: true, // Use standalone component
  imports: [CommonModule], // Add CommonModule for ngFor
  templateUrl: './games.html',
  styleUrls: ['./games.css'],
})
export class Games implements OnInit {
  games: Game[] = [];

  private http = inject(HttpClient);

  ngOnInit() {
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
