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

type SeasonType = 'REG' | 'PRE';

@Injectable()
export class NflScraperService {
  private readonly logger = new Logger(NflScraperService.name);

  // NFL team mappings - order matters! Most specific terms first
  private readonly TEAM_MAPPINGS = {
    ARI: ['Cardinals', 'Arizona Cardinals', 'Arizona'],
    ATL: ['Falcons', 'Atlanta Falcons', 'Atlanta'],
    BAL: ['Ravens', 'Baltimore Ravens', 'Baltimore'],
    BUF: ['Bills', 'Buffalo Bills', 'Buffalo'],
    CAR: ['Panthers', 'Carolina Panthers', 'Carolina'],
    CHI: ['Bears', 'Chicago Bears', 'Chicago'],
    CIN: ['Bengals', 'Cincinnati Bengals', 'Cincinnati'],
    CLE: ['Browns', 'Cleveland Browns', 'Cleveland'],
    DAL: ['Cowboys', 'Dallas Cowboys', 'Dallas'],
    DEN: ['Broncos', 'Denver Broncos', 'Denver'],
    DET: ['Lions', 'Detroit Lions', 'Detroit'],
    GB: ['Packers', 'Green Bay Packers', 'Green Bay'],
    HOU: ['Texans', 'Houston Texans', 'Houston'],
    IND: ['Colts', 'Indianapolis Colts', 'Indianapolis'],
    JAC: ['Jaguars', 'Jacksonville Jaguars', 'Jacksonville', 'JAX'],
    KC: ['Chiefs', 'Kansas City Chiefs', 'Kansas City'],
    LV: ['Raiders', 'Las Vegas Raiders', 'Las Vegas'],
    LAC: ['Chargers', 'LA Chargers', 'Los Angeles Chargers', 'L.A. Chargers'],
    LAR: ['Rams', 'LA Rams', 'Los Angeles Rams', 'L.A. Rams'],
    MIA: ['Dolphins', 'Miami Dolphins', 'Miami'],
    MIN: ['Vikings', 'Minnesota Vikings', 'Minnesota'],
    NE: ['Patriots', 'New England Patriots', 'New England'],
    NO: ['Saints', 'New Orleans Saints', 'New Orleans'],
    NYG: ['Giants', 'NY Giants', 'New York Giants', 'N.Y. Giants'],
    NYJ: ['Jets', 'NY Jets', 'New York Jets', 'N.Y. Jets'],
    PHI: ['Eagles', 'Philadelphia Eagles', 'Philadelphia'],
    PIT: ['Steelers', 'Pittsburgh Steelers', 'Pittsburgh'],
    SF: ['49ers', 'San Francisco 49ers', 'San Francisco'],
    SEA: ['Seahawks', 'Seattle Seahawks', 'Seattle'],
    TB: ['Buccaneers', 'Tampa Bay Buccaneers', 'Tampa Bay'],
    TEN: ['Titans', 'Tennessee Titans', 'Tennessee'],
    WAS: ['Commanders', 'Washington Commanders', 'Washington'],
  };

  async getWeekResults(
    week: number,
    season = 2025,
    seasonType: SeasonType = 'REG'
  ): Promise<GameResult[]> {
    this.logger.log(
      `Fetching results for Week ${week}, ${season} season, type ${seasonType}`
    );

    try {
      const scraperPromises = [
        this.scrapeESPN(week, season, seasonType),
        this.scrapeNFL(week, season, seasonType),
      ];

      if (seasonType === 'REG') {
        scraperPromises.push(this.scrapeCBS(week, season, seasonType));
      }

      const [espnResults, nflResults, cbsResults] = await Promise.allSettled(
        scraperPromises
      );

      const espnGames =
        espnResults?.status === 'fulfilled' ? espnResults.value : [];
      const nflGames =
        nflResults?.status === 'fulfilled' ? nflResults.value : [];
      const cbsGames =
        cbsResults?.status === 'fulfilled' ? cbsResults.value : [];

      this.logger.log(
        `Scraped results - ESPN: ${espnGames.length}, NFL: ${nflGames.length}, CBS: ${cbsGames.length}`
      );

      return this.findConsensusResults(espnGames, nflGames, cbsGames);
    } catch (error) {
      this.logger.error('Error fetching week results:', error);
      throw error;
    }
  }

  async getPreseasonWeekResults(
    week: number,
    season = 2025
  ): Promise<GameResult[]> {
    return this.getWeekResults(week, season, 'PRE');
  }

  private async scrapeESPN(
    week: number,
    season: number,
    seasonType: SeasonType
  ): Promise<ScrapedResult[]> {
    try {
      const espnSeasonType = seasonType === 'REG' ? 2 : 1;
      const url = `https://site.api.espn.com/apis/site/v2/sports/football/nfl/scoreboard?dates=${season}&seasontype=${espnSeasonType}&week=${week}`;

      const response = await axios.get(url, {
        timeout: 15000,
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        },
      });

      const games = response.data.events || [];
      const results: ScrapedResult[] = [];

      for (const espnGame of games) {
        const competition = espnGame.competitions[0];
        const competitors = competition.competitors;
        const homeTeam = competitors.find((c) => c.homeAway === 'home');
        const awayTeam = competitors.find((c) => c.homeAway === 'away');
        const statusRaw = espnGame.status.type.name;

        // Standardize status
        let status = 'UNKNOWN';
        if (statusRaw === 'STATUS_FINAL') {
          status = 'FINAL';
        } else if (statusRaw === 'STATUS_SCHEDULED') {
          status = 'SCHEDULED';
        } else if (statusRaw === 'STATUS_IN_PROGRESS') {
          status = 'IN_PROGRESS';
        } else if (statusRaw === 'STATUS_POSTPONED') {
          status = 'POSTPONED';
        }

        const homeScore = parseInt(homeTeam.score);
        const awayScore = parseInt(awayTeam.score);

        let winner: string | null = null;
        if (status === 'FINAL') {
          if (homeScore > awayScore) {
            winner = homeTeam.team.abbreviation;
          } else if (awayScore > homeScore) {
            winner = awayTeam.team.abbreviation;
          } else {
            winner = 'TIE';
          }
        }

        results.push({
          homeTeam: homeTeam.team.abbreviation,
          awayTeam: awayTeam.team.abbreviation,
          homeScore,
          awayScore,
          winner,
          status,
        });
      }

      this.logger.log(`ESPN: Found ${results.length} games`);
      return results;
    } catch (error) {
      this.logger.error('ESPN scraping error:', error.message);
      return [];
    }
  }

  private async scrapeNFL(
    week: number,
    season: number,
    seasonType: SeasonType
  ): Promise<ScrapedResult[]> {
    try {
      const url = `https://www.nfl.com/scores/${season}/${seasonType}${week}`;

      const response = await axios.get(url, {
        timeout: 15000,
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        },
      });

      const html = response.data;
      const results: ScrapedResult[] = [];

      const gameDataRegex = /window\.__INITIAL_DATA__\s*=\s*({.+?});/;
      const match = html.match(gameDataRegex);

      if (match) {
        try {
          const gameData = JSON.parse(match[1]);
          const games = gameData?.page?.content?.games || [];

          for (const nflGame of games) {
            const homeTeam = nflGame.homeTeam?.abbreviation;
            const awayTeam = nflGame.visitorTeam?.abbreviation;
            const homeScore = parseInt(
              nflGame.homeTeamScore || nflGame.homeScore
            );
            const awayScore = parseInt(
              nflGame.visitorTeamScore || nflGame.awayScore
            );

            // Standardize status
            let status = 'UNKNOWN';
            if (nflGame.gameStatus === 'FINAL' || nflGame.phase === 'FINAL') {
              status = 'FINAL';
            } else if (
              nflGame.gameStatus === 'PRE_GAME' ||
              nflGame.phase === 'PRE_GAME'
            ) {
              status = 'SCHEDULED';
            } else if (
              nflGame.gameStatus === 'IN_PROGRESS' ||
              nflGame.phase === 'IN_PROGRESS'
            ) {
              status = 'IN_PROGRESS';
            } else if (
              nflGame.gameStatus === 'POSTPONED' ||
              nflGame.phase === 'POSTPONED'
            ) {
              status = 'POSTPONED';
            }

            let winner: string | null = null;
            if (status === 'FINAL') {
              if (homeScore > awayScore) {
                winner = homeTeam;
              } else if (awayScore > homeScore) {
                winner = awayTeam;
              } else {
                winner = 'TIE';
              }
            }

            results.push({
              homeTeam,
              awayTeam,
              homeScore,
              awayScore,
              winner,
              status,
            });
          }
        } catch (parseError) {
          this.logger.error('NFL JSON parsing error:', parseError.message);
        }
      }

      this.logger.log(`NFL: Found ${results.length} games`);
      return results;
    } catch (error) {
      this.logger.error('NFL scraping error:', error.message);
      return [];
    }
  }

  private async scrapeCBS(
    week: number,
    season: number,
    seasonType: SeasonType
  ): Promise<ScrapedResult[]> {
    try {
      if (seasonType === 'REG') {
        this.logger.error(
          `CBS supports seasonType === REG only, not ${seasonType}`
        );
      }
      const url = `https://www.cbssports.com/nfl/scoreboard/${season}/regular/${week}/`;

      const response = await axios.get(url, {
        timeout: 15000,
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        },
      });

      const html = response.data;
      const results: ScrapedResult[] = [];

      const dataRegex = /window\.INITIAL_STATE\s*=\s*({.+?});/;
      const match = html.match(dataRegex);

      if (match) {
        try {
          const data = JSON.parse(match[1]);
          const games = data?.scoreboard?.games || [];

          for (const cbsGame of games) {
            const homeTeam = cbsGame.home?.team?.abbrev;
            const awayTeam = cbsGame.away?.team?.abbrev;
            const homeScore = parseInt(
              cbsGame.home?.score || cbsGame.home?.points
            );
            const awayScore = parseInt(
              cbsGame.away?.score || cbsGame.away?.points
            );

            // Standardize status
            let status = 'UNKNOWN';
            if (cbsGame.status === 'final' || cbsGame.gameState === 'final') {
              status = 'FINAL';
            } else if (
              cbsGame.status === 'pre_game' ||
              cbsGame.gameState === 'pre_game'
            ) {
              status = 'SCHEDULED';
            } else if (
              cbsGame.status === 'in_progress' ||
              cbsGame.gameState === 'in_progress'
            ) {
              status = 'IN_PROGRESS';
            } else if (
              cbsGame.status === 'postponed' ||
              cbsGame.gameState === 'postponed'
            ) {
              status = 'POSTPONED';
            }

            let winner: string | null = null;
            if (status === 'FINAL') {
              if (homeScore > awayScore) {
                winner = homeTeam;
              } else if (awayScore > homeScore) {
                winner = awayTeam;
              } else {
                winner = 'TIE';
              }
            }

            results.push({
              homeTeam,
              awayTeam,
              homeScore,
              awayScore,
              winner,
              status,
            });
          }
        } catch (parseError) {
          this.logger.error('CBS JSON parsing error:', parseError.message);
        }
      }

      this.logger.log(`CBS: Found ${results.length} games`);
      return results;
    } catch (error) {
      this.logger.error('CBS scraping error:', error.message);
      return [];
    }
  }

  private normalizeTeamAbbreviation(abbreviation: string): string {
    if (abbreviation && abbreviation.toUpperCase() === 'JAX') {
      return 'JAC';
    }
    return abbreviation;
  }

  private findConsensusResults(
    espnGames: ScrapedResult[],
    nflGames: ScrapedResult[],
    cbsGames: ScrapedResult[]
  ): GameResult[] {
    const allGames = new Map<string, ScrapedResult[]>();

    [...espnGames, ...nflGames, ...cbsGames].forEach((game) => {
      if (game) {
        game.homeTeam = this.normalizeTeamAbbreviation(game.homeTeam);
        game.awayTeam = this.normalizeTeamAbbreviation(game.awayTeam);
        game.winner = this.normalizeTeamAbbreviation(game.winner);

        const key = this.createGameKey(game.homeTeam, game.awayTeam);
        if (!allGames.has(key)) {
          allGames.set(key, []);
        }
        allGames.get(key)?.push(game);
      }
    });

    const consensusResults: GameResult[] = [];

    allGames.forEach((games) => {
      if (games.length >= 1) {
        const winnerCounts = new Map<string, number>();
        games.forEach((game) => {
          winnerCounts.set(
            game.winner,
            (winnerCounts.get(game.winner) || 0) + 1
          );
        });

        // Find the most common winner (could be 'TIE', team abbrev, or null)
        const consensusWinnerEntry = Array.from(winnerCounts.entries()).sort(
          ([, a], [, b]) => b - a
        )[0];
        const consensusWinner = consensusWinnerEntry
          ? consensusWinnerEntry[0]
          : null;
        const sourcesAgreed = consensusWinnerEntry
          ? consensusWinnerEntry[1]
          : 0;

        // Find a representative game (prefer one with a winner, else any)
        let representativeGame = games.find(
          (g) => g.winner === consensusWinner
        );
        if (!representativeGame) {
          representativeGame = games[0];
        }

        // Determine completion and winner
        let winner = representativeGame.winner;
        let isComplete = true;
        if (!winner || winner === null || winner === undefined) {
          winner = null;
          isComplete = false;
        } else if (representativeGame.status !== 'FINAL') {
          isComplete = false;
        }

        consensusResults.push({
          homeTeam: representativeGame.homeTeam,
          awayTeam: representativeGame.awayTeam,
          homeScore: representativeGame.homeScore,
          awayScore: representativeGame.awayScore,
          winner,
          status: representativeGame.status,
          sourcesAgreed,
          isComplete,
        });
      }
    });

    this.logger.log(
      `Found ${consensusResults.length} games with consensus results`
    );
    return consensusResults;
  }

  private createGameKey(homeTeam: string, awayTeam: string): string {
    return `${awayTeam}@${homeTeam}`;
  }

  private matchesTeam(apiTeam: string, gameTeam: string): boolean {
    if (!apiTeam || !gameTeam) return false;

    if (apiTeam.toUpperCase() === gameTeam.toUpperCase()) {
      return true;
    }

    const mappings = this.TEAM_MAPPINGS[gameTeam.toUpperCase()] || [];
    for (const mapping of mappings) {
      if (apiTeam.toUpperCase() === mapping.toUpperCase()) {
        return true;
      }

      if (
        apiTeam.toUpperCase().includes(mapping.toUpperCase()) ||
        mapping.toUpperCase().includes(apiTeam.toUpperCase())
      ) {
        if (this.isAmbiguousMatch(apiTeam, mapping, gameTeam)) {
          continue;
        }

        return true;
      }
    }

    return false;
  }

  private isAmbiguousMatch(
    apiTeam: string,
    mapping: string,
    gameTeam: string
  ): boolean {
    const apiUpper = apiTeam.toUpperCase();
    const mappingUpper = mapping.toUpperCase();
    const gameUpper = gameTeam.toUpperCase();

    if (
      (gameUpper === 'LAC' || gameUpper === 'LAR') &&
      (mappingUpper === 'LOS ANGELES' || mappingUpper === 'LA')
    ) {
      if (gameUpper === 'LAC' && !apiUpper.includes('CHARGER')) return true;
      if (gameUpper === 'LAR' && !apiUpper.includes('RAM')) return true;
    }

    if (
      (gameUpper === 'NYG' || gameUpper === 'NYJ') &&
      (mappingUpper === 'NEW YORK' || mappingUpper === 'NY')
    ) {
      if (gameUpper === 'NYG' && !apiUpper.includes('GIANT')) return true;
      if (gameUpper === 'NYJ' && !apiUpper.includes('JET')) return true;
    }

    return false;
  }
}
