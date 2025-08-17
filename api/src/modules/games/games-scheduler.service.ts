import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { GamesService } from './games.service';

@Injectable()
export class GamesSchedulerService {
  private readonly logger = new Logger(GamesSchedulerService.name);

  constructor(private readonly gamesService: GamesService) {}

  @Cron('*/5 * * * *')
  async handleGamesEnded() {
    this.logger.log('Starting scheduled job: checking for ended games');
    try {
      await this.gamesService.checkForEndedGames();
      this.logger.log('Scheduled job finished successfully.');
    } catch (error) {
      this.logger.error('Scheduled job failed:', error.message);
    }
  }
}
