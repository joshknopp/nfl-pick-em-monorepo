import { Injectable } from '@nestjs/common';
import * as admin from 'firebase-admin';
import { GameDto, PickDTO } from 'libs';
import { GamesService } from '../games/games.service';
import { PicksService } from '../picks/picks.service';

@Injectable()
export class LeaderboardService {
  constructor(
    private readonly gamesService: GamesService,
    private readonly picksService: PicksService
  ) {}

  async getLeaderboard(
    week: number,
    currentUser: { id: string; email: string; displayName?: string }
  ) {
    const users = await this.getAllUsers();
    const games = await this.gamesService.getGames();
    const weekGames = games
      .filter((game) => game.week === week)
      .sort((a, b) => a.kickoffTime.localeCompare(b.kickoffTime));
    const picks = await this.picksService.getLeaguePicks();

    // Fetch usernames from Firestore for all users
    const usernameMap: Record<string, string> = {};
    const db = admin.firestore();
    const userDocs = await db.collection('users').get();
    userDocs.forEach((doc) => {
      const data = doc.data();
      if (data?.username) {
        usernameMap[doc.id] = data.username;
      }
    });

    const leaderboard = users.map((user) => {
      const userPicks = picks.filter((pick) => pick.user === user.uid);
      const { wins, losses } = this.calculateWinLoss(userPicks, games);
      // Use username if available, else displayName, else email
      const displayName =
        usernameMap[user.uid] || user.displayName || user.email;
      return {
        user: {
          uid: user.uid,
          displayName,
          email: user.email,
        },
        wins,
        losses,
        picks: this.getPicksForWeek(
          userPicks,
          weekGames,
          user.uid,
          currentUser.id
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

  private calculateWinLoss(picks: PickDTO[], games: GameDto[]) {
    let wins = 0;
    let losses = 0;
    const completedGames = games.filter((game) => game.winner);

    for (const game of completedGames) {
      const pick = picks.find(
        (p) =>
          p.season === game.season &&
          p.week === game.week &&
          p.awayTeam === game.awayTeam &&
          p.homeTeam === game.homeTeam
      );
      if (pick?.pickWinner === game.winner) {
        wins++;
      } else {
        losses++;
      }
    }

    return { wins, losses };
  }

  private getPicksForWeek(
    picks: PickDTO[],
    weekGames: GameDto[],
    userId: string,
    currentUserId: string
  ) {
    const weekPicks = [];
    for (const game of weekGames) {
      const pick = picks.find(
        (p) =>
          p.season === game.season &&
          p.week === game.week &&
          p.awayTeam === game.awayTeam &&
          p.homeTeam === game.homeTeam
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
