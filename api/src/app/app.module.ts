import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { GamesModule } from './games.module';
import { GamesController } from './games.controller';
import { GamesService } from './games.service';

@Module({
  imports: [GamesModule],
  controllers: [AppController, GamesController],
  providers: [AppService, GamesService],
})
export class AppModule {}
