import { Controller, Get, Post, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { GameDto } from 'libs';
import { AuthGuard } from '../../shared/guards/auth.guard';
import { GamesService } from './games.service';

@ApiTags('Games')
@ApiBearerAuth()
@Controller('games')
export class GamesController {
  constructor(private readonly gamesService: GamesService) {}

  @UseGuards(AuthGuard)
  @Get()
  @ApiOperation({ summary: 'Get a list of NFL games from Firestore' })
  @ApiResponse({ status: 200, description: 'List of games.' })
  async getGames(): Promise<GameDto[]> {
    return await this.gamesService.getGames();
  }

  @UseGuards(AuthGuard)
  @Post('check-ended')
  @ApiOperation({
    summary: 'Check for ended games and update winners from scraper',
  })
  @ApiResponse({
    status: 200,
    description: 'An array of games that have been updated with a winner.',
  })
  async checkForEndedGames(): Promise<GameDto[]> {
    return await this.gamesService.checkForEndedGames();
  }
}
