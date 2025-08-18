import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { GamesModule } from '../modules/games/games.module';
import { UserController } from './user.controller';
import { AuthGuard } from '../shared/guards/auth.guard';
import { PicksModule } from '../modules/picks/picks.module';
import { LeaderboardModule } from '../modules/leaderboard/leaderboard.module';
import { ScraperModule } from '../modules/scraper/scraper.module';
import { UserService } from './user.service';
import { ScheduleModule } from '@nestjs/schedule';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    GamesModule,
    PicksModule,
    LeaderboardModule,
    ScraperModule,
  ],
  controllers: [AppController, UserController],
  providers: [AppService, AuthGuard, UserService],
})
export class AppModule {}
