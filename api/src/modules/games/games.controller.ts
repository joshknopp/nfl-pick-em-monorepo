import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { GamesService } from './games.service';

@ApiTags('Games')
@Controller('games')
export class GamesController {
  constructor(private readonly gamesService: GamesService) {}

  @Get()
  @ApiOperation({ summary: 'Get a list of mock NFL games' })
  @ApiResponse({ status: 200, description: 'List of games.' })
  getGames(): any[] {
    return this.gamesService.getMockGames();
  }
}
