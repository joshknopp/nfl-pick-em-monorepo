import { Injectable } from '@nestjs/common';
import { GameDto } from 'libs';
import * as admin from 'firebase-admin';
import { Observable, from } from 'rxjs';

@Injectable()
export class GamesService {
  getGames(): Observable<GameDto[]> {
    return from(
      admin
        .firestore()
        .collection('games')
        .get()
        .then((snapshot) =>
          snapshot.docs.map((doc) => {
            const data = doc.data();
            return {
              season: data.season,
              awayTeam: data.awayTeam,
              homeTeam: data.homeTeam,
              kickoffTime:
                (
                  data.kickoffTime?.toDate?.() ?? data.kickoffTime
                )?.toISOString?.() ?? '',
              week: data.week,
              winner: data.winner ?? null,
            };
          })
        )
    );
  }
}
