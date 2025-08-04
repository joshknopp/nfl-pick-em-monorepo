import { Injectable } from '@nestjs/common';
import { GameDto } from 'libs';
import * as admin from 'firebase-admin';

@Injectable()
export class GamesService {
  async getGames(): Promise<GameDto[]> {
    const snapshot = await admin.firestore().collection('games').get();
    return snapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        season: data.season,
        awayTeam: data.awayTeam,
        homeTeam: data.homeTeam,
        kickoffTime:
          (data.kickoffTime?.toDate?.() ?? data.kickoffTime)?.toISOString?.() ??
          '',
        week: data.week,
        winner: data.winner ?? null,
      };
    });
  }
}
