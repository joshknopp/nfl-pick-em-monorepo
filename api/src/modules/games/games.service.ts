import { Inject, Injectable, Logger } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';
import { GameDto, SerializableGame } from 'libs';
import * as admin from 'firebase-admin';
import { NflScraperService } from '../scraper/scraper.service';

interface GameDocument extends SerializableGame {
  kickoffTime: any;
  winner?: string | null;
}

const FIVE_DAYS_MS = 5 * 24 * 60 * 60 * 1000;

@Injectable()
export class GamesService {
  constructor(
    private readonly nflScraperService: NflScraperService,
    private readonly logger: Logger,
    @Inject(CACHE_MANAGER) private readonly cacheManager: Cache
  ) {}

  getCurrentSeasonRange(today: Date = new Date()): { start: Date; end: Date; season: number } {
    const year = today.getFullYear();
    const month = today.getMonth(); // 0-indexed: 0 = Jan, 1 = Feb, 2 = Mar, 3 = Apr
    const seasonYear = month < 3 ? year - 1 : year;
    const start = new Date(seasonYear, 3, 1, 0, 0, 0, 0);
    const end = new Date(seasonYear + 1, 2, 31, 23, 59, 59, 999);
    return { start, end, season: seasonYear };
  }

  async getGames(today: Date = new Date()): Promise<GameDto[]> {
    const { start, end, season } = this.getCurrentSeasonRange(today);
    const cacheKey = `games:${season}`;

    const cached = await this.cacheManager.get<GameDto[]>(cacheKey);
    if (cached) {
      return cached;
    }

    const snapshot = await admin
      .firestore()
      .collection('games')
      .where('kickoffTime', '>=', admin.firestore.Timestamp.fromDate(start))
      .where('kickoffTime', '<=', admin.firestore.Timestamp.fromDate(end))
      .get();

    const games = snapshot.docs.map((doc) => {
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

    await this.cacheManager.set(cacheKey, games, FIVE_DAYS_MS);
    return games;
  }

  async checkForEndedGames(): Promise<GameDto[]> {
    this.logger.log('Checking for ended games without a winner...');
    const now = new Date();
    const twoAndAHalfHoursAgo = new Date(now.getTime() - 2.5 * 60 * 60 * 1000);
    const { start } = this.getCurrentSeasonRange(now);

    const snapshot = await admin
      .firestore()
      .collection('games')
      .where('kickoffTime', '>=', admin.firestore.Timestamp.fromDate(start))
      .where('kickoffTime', '<=', admin.firestore.Timestamp.fromDate(twoAndAHalfHoursAgo))
      .get();

    const gamesToUpdate: GameDto[] = [];
    const gamesToCheck = snapshot.docs
      .map((doc) => {
        const data = doc.data() as GameDocument;
        const kickoffTime = data.kickoffTime?.toDate?.() ?? data.kickoffTime;
        return { id: doc.id, ...data, kickoffTime: new Date(kickoffTime) };
      })
      .filter((game) => !game.winner);

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
      const seasonNum = parseInt(season);
      const weekNum = parseInt(week);
      const gamesForThisWeek = gamesByWeek[key];
      
      // Log detailed info about which documents triggered this query
      this.logger.log(
        `Processing season ${seasonNum}, week ${weekNum} - ${gamesForThisWeek.length} game(s): ${gamesForThisWeek
          .map((g) => `${g.id} (${g.awayTeam}@${g.homeTeam}, kickoff: ${g.kickoffTime.toISOString()})`)
          .join(' | ')}`
      );
      
      const results = await this.nflScraperService.getWeekResults(
        weekNum,
        seasonNum
      );

      for (const game of gamesByWeek[key]) {
        const result = results.find(
          (r) =>
            this.nflScraperService.areTeamsEqual(r.homeTeam, game.homeTeam) &&
            this.nflScraperService.areTeamsEqual(r.awayTeam, game.awayTeam)
        );

        if (!result) {
          this.logger.warn(
            `No scraper result match found for game ${game.id} (${game.awayTeam}@${game.homeTeam})`
          );
        } else if (result && result.winner) {
          let winner = result.winner;
          if (this.nflScraperService.areTeamsEqual(result.winner, game.awayTeam)) {
            winner = game.awayTeam;
          } else if (this.nflScraperService.areTeamsEqual(result.winner, game.homeTeam)) {
            winner = game.homeTeam;
          }
          this.logger.log(`Found winner for game ${game.id}: ${winner}`);
          await admin
            .firestore()
            .collection('games')
            .doc(game.id)
            .update({ winner });
          gamesToUpdate.push({ ...game, winner });
        } else {
          this.logger.log(
            `Game ${game.id} (${game.awayTeam}@${game.homeTeam}) found in scraped results but has no winner yet (status: ${result.status})`
          );
        }
      }
    }

    if (gamesToUpdate.length > 0) {
      await this.invalidateGamesCache();
    }

    return gamesToUpdate;
  }

  async invalidateGamesCache(season?: number): Promise<void> {
    if (season) {
      await this.cacheManager.del(`games:${season}`);
    } else {
      const currentSeason = this.getCurrentSeasonRange().season;
      await this.cacheManager.del(`games:${currentSeason}`);
      await this.cacheManager.del(`games:${currentSeason - 1}`);
      await this.cacheManager.del(`games:${currentSeason + 1}`);
    }
  }
}
