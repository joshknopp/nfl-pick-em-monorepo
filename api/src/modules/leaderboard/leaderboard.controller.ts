import { Controller, Get, Query, UseGuards, Req } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { AuthGuard } from '../../shared/guards/auth.guard';
import { LeaderboardService } from './leaderboard.service';

@ApiTags('Leaderboard')
@ApiBearerAuth()
@Controller('leaderboard')
export class LeaderboardController {
  constructor(private readonly leaderboardService: LeaderboardService) {}

  @UseGuards(AuthGuard)
  @Get()
  @ApiOperation({ summary: 'Get leaderboard data for a given week' })
  @ApiResponse({ status: 200, description: 'Leaderboard data.' })
  async getLeaderboard(@Query('week') week: string, @Req() req) {
    return await this.leaderboardService.getLeaderboard(
      parseInt(week, 10),
      req.user,
    );
  }
}
