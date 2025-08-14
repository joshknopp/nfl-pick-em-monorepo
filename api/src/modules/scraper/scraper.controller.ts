import { Controller, Get, Param } from '@nestjs/common';
import { NflScraperService } from './scraper.service';

@Controller('scraper')
export class ScraperController {
  constructor(private readonly scraperService: NflScraperService) {}

  @Get(':season/:week')
  getGames(
    @Param('season') season: string,
    @Param('week') week: string,
  ) {
    return this.scraperService.getWeekResults(
      parseInt(week, 10),
      parseInt(season, 10),
    );
  }

  @Get('preseason/:season/:week')
  getPreseasonGames(
    @Param('season') season: string,
    @Param('week') week: string,
  ) {
    return this.scraperService.getPreseasonWeekResults(
      parseInt(week, 10),
      parseInt(season, 10),
    );
  }
}
