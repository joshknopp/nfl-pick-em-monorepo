import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';

interface GameResult {
  homeTeam: string;
  awayTeam: string;
  homeScore: number;
  awayScore: number;
  winner: string;
  status: string;
  sourcesAgreed: number;
  isComplete: boolean;
}

interface ScrapedResult {
  homeTeam: string;
  awayTeam: string;
  homeScore: number;
  awayScore: number;
  winner: string;
  status: string;
}

@Injectable()
export class NflScraperService {
  private readonly logger = new Logger(NflScraperService.name);

  async getWeekResults(week: number, season: number = 2025): Promise<GameResult[]> {
    this.logger.log(`Fetching results for Week ${week}, ${season} season from ESPN`);

    try {
      const espnGames = await this.scrapeESPN(week, season);
      this.logger.log(`Scraped results - ESPN: ${espnGames.length}`);
      return this.formatResults(espnGames);
    } catch (error) {
      this.logger.error('Error fetching week results:', error);
      throw error;
    }
  }

  private async scrapeESPN(week: number, season: number): Promise<ScrapedResult[]> {
    try {
      const url = `https://site.api.espn.com/apis/site/v2/sports/football/nfl/scoreboard?dates=${season}&seasontype=2&week=${week}`;

      const response = await axios.get(url, {
        timeout: 15000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        },
      });

      const games = response.data.events || [];
      const results: ScrapedResult[] = [];

      for (const espnGame of games) {
        const competition = espnGame.competitions[0];
        const competitors = competition.competitors;
        const homeTeam = competitors.find((c) => c.homeAway === 'home');
        const awayTeam = competitors.find((c) => c.homeAway === 'away');
        const status = espnGame.status.type.name;

        if (status === 'STATUS_FINAL') {
          const homeScore = parseInt(homeTeam.score);
          const awayScore = parseInt(awayTeam.score);

          let winner = 'TIE';
          if (homeScore > awayScore) {
            winner = homeTeam.team.abbreviation;
          } else if (awayScore > homeScore) {
            winner = awayTeam.team.abbreviation;
          }

          results.push({
            homeTeam: homeTeam.team.abbreviation,
            awayTeam: awayTeam.team.abbreviation,
            homeScore,
            awayScore,
            winner,
            status: 'FINAL',
          });
        }
      }

      this.logger.log(`ESPN: Found ${results.length} completed games`);
      return results;
    } catch (error) {
      this.logger.error('ESPN scraping error:', error.message);
      return [];
    }
  }

  private formatResults(games: ScrapedResult[]): GameResult[] {
    return games.map((game) => ({
      ...game,
      sourcesAgreed: 1,
      isComplete: true,
    }));
  }
}
