import { Injectable } from '@nestjs/common';

@Injectable()
export class GamesService {
  getMockGames(): any[] {
    return [
      {
        id: 'game1',
        homeTeam: 'Chiefs',
        awayTeam: 'Ravens',
        week: 1,
        date: '2025-09-04',
      },
      {
        id: 'game2',
        homeTeam: 'Lions',
        awayTeam: '49ers',
        week: 1,
        date: '2025-09-05',
      },
    ];
  }
}
