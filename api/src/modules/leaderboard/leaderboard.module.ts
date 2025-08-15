import { Module } from '@nestjs/common';
import { LeaderboardController } from './leaderboard.controller';
import { LeaderboardService } from './leaderboard.service';
import { GamesModule } from '../games/games.module';
import { PicksModule } from '../picks/picks.module';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [GamesModule, PicksModule, UsersModule],
  controllers: [LeaderboardController],
  providers: [LeaderboardService],
})
export class LeaderboardModule {}
