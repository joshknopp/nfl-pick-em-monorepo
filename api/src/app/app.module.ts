import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { GamesModule } from '../modules/games/games.module';
import { UserController } from './user.controller';
import { AuthGuard } from '../shared/guards/auth.guard';
import { PicksModule } from '../modules/picks/picks.module';

@Module({
  imports: [GamesModule, PicksModule],
  controllers: [AppController, UserController],
  providers: [AppService, AuthGuard],
})
export class AppModule {}
