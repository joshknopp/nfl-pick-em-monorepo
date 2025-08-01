import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { GamesModule } from '../modules/games/games.module';
import { UserController } from './user.controller';
import { AuthGuard } from '../shared/guards/auth.guard';

@Module({
  imports: [GamesModule],
  controllers: [AppController, UserController],
  providers: [AppService, AuthGuard],
})
export class AppModule {}
