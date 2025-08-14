import { Injectable, Logger } from '@nestjs/common';
import { GameDto, SerializableGame } from 'libs';
import * as admin from 'firebase-admin';
import { NflScraperService } from '../scraper/scraper.service';

interface GameDocument extends SerializableGame {
  kickoffTime: any;
  winner?: string | null;
}

@Injectable()
export class GamesService {
  constructor(
    private readonly nflScraperService: NflScraperService,
    private readonly logger: Logger,
  ) {}

  async getGames(): Promise<GameDto[]> {
    const snapshot = await admin.firestore().collection('games').get();
    return snapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
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

  async checkForEndedGames(): Promise<GameDto[]> {
    this.logger.log('Checking for ended games without a winner...');
    const now = new Date();
    const twoAndAHalfHoursAgo = new Date(now.getTime() - 2.5 * 60 * 60 * 1000);

    const snapshot = await admin.firestore().collection('games').get();

    const gamesToUpdate: GameDto[] = [];
    const gamesToCheck = snapshot.docs
      .map((doc) => {
        const data = doc.data() as GameDocument;
        if (data.winner) {
          return null;
        }
        const kickoffTime = data.kickoffTime?.toDate?.() ?? data.kickoffTime;
        return { id: doc.id, ...data, kickoffTime: new Date(kickoffTime) };
      })
      .filter((game) => game && game.kickoffTime < twoAndAHalfHoursAgo);

    if (gamesToCheck.length === 0) {
      this.logger.log('No games to check.');
      return [];
    }

    this.logger.log(`Found ${gamesToCheck.length} games to check.`);

    const gamesByWeek = gamesToCheck.reduce((acc, game) => {
      const key = `${game.season}-${game.week}`;
      if (!acc[key]) {
        acc[key] = [];
      }
      acc[key].push(game);
      return acc;
    }, {});

    for (const key in gamesByWeek) {
      const [season, week] = key.split('-');
      const results = await this.nflScraperService.getWeekResults(
        parseInt(week),
        parseInt(season),
      );

      for (const game of gamesByWeek[key]) {
        const result = results.find(
          (r) =>
            r.homeTeam === game.homeTeam && r.awayTeam === game.awayTeam,
        );

        if (result && result.winner) {
          this.logger.log(
            `Found winner for game ${game.id}: ${result.winner}`,
          );
          await admin
            .firestore()
            .collection('games')
            .doc(game.id)
            .update({ winner: result.winner });
          gamesToUpdate.push({ ...game, winner: result.winner });
        }
      }
    }

    return gamesToUpdate;
  }
}
