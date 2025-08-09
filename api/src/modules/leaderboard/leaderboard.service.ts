import { Injectable } from '@nestjs/common';
import * as admin from 'firebase-admin';
import { GameDto } from 'libs';
import { GamesService } from '../games/games.service';
import { PicksService } from '../picks/picks.service';

@Injectable()
export class LeaderboardService {
  constructor(
    private readonly gamesService: GamesService,
    private readonly picksService: PicksService,
  ) {}

  async getLeaderboard(week: number, currentUser: any) {
    const users = await this.getAllUsers();
    const games = await this.gamesService.getGames();
    const weekGames = games.filter((game) => game.week === week);
    const picks = await this.picksService.getLeaguePicks();

    const leaderboard = users.map((user) => {
      const userPicks = picks.filter((pick) => pick.user === user.uid);
      const { wins, losses } = this.calculateWinLoss(userPicks, games);
      return {
        user: {
          uid: user.uid,
          displayName: user.displayName,
          email: user.email,
        },
        wins,
        losses,
        picks: this.getPicksForWeek(
          userPicks,
          weekGames,
          user.uid,
          currentUser.id,
        ),
      };
    });

    // Sort users by wins
    leaderboard.sort((a, b) => b.wins - a.wins);

    return {
      week,
      games: weekGames,
      leaderboard,
    };
  }

  private async getAllUsers() {
    const userRecords = await admin.auth().listUsers();
    return userRecords.users.map((user) => ({
      uid: user.uid,
      email: user.email,
      displayName: user.displayName,
    }));
  }

  private calculateWinLoss(picks: any[], games: GameDto[]) {
    let wins = 0;
    let losses = 0;
    const completedGames = games.filter((game) => game.winner);

    for (const pick of picks) {
      const game = completedGames.find(
        (g) =>
          g.season === pick.season &&
          g.week === pick.week &&
          g.awayTeam === pick.awayTeam &&
          g.homeTeam === pick.homeTeam,
      );
      if (game) {
        if (pick.pickWinner === game.winner) {
          wins++;
        } else {
          losses++;
        }
      }
    }

    return { wins, losses };
  }

  private getPicksForWeek(
    picks: any[],
    weekGames: GameDto[],
    userId: string,
    currentUserId: string,
  ) {
    const weekPicks = [];
    for (const game of weekGames) {
      const pick = picks.find(
        (p) =>
          p.season === game.season &&
          p.week === game.week &&
          p.awayTeam === game.awayTeam &&
          p.homeTeam === game.homeTeam,
      );

      const kickoff = new Date(game.kickoffTime);
      const now = new Date();
      const isGameLocked = kickoff <= now;

      if (userId === currentUserId || isGameLocked) {
        weekPicks.push(pick ? pick.pickWinner : null);
      } else {
        weekPicks.push(null);
      }
    }
    return weekPicks;
  }
}
