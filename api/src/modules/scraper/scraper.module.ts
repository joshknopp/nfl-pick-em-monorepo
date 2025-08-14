import { Module } from '@nestjs/common';
import { ScraperController } from './scraper.controller';
import { NflScraperService } from './scraper.service';

@Module({
  controllers: [ScraperController],
  providers: [NflScraperService],
  exports: [NflScraperService],
})
export class ScraperModule {}
