import { Logger, Module } from '@nestjs/common';
import { ScraperModule } from '../scraper/scraper.module';
import { GamesController } from './games.controller';
import { GamesSchedulerService } from './games-scheduler.service';
import { GamesService } from './games.service';

@Module({
  imports: [ScraperModule],
  controllers: [GamesController],
  providers: [GamesService, Logger, GamesSchedulerService],
  exports: [GamesService],
})
export class GamesModule {}
