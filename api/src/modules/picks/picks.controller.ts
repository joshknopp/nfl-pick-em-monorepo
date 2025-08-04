import { Controller, Get, Post, Body, Req, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { PicksService } from './picks.service';
import { PickDTO } from 'libs';
import { AuthGuard } from '../../shared/guards/auth.guard';

@ApiTags('Picks')
@ApiBearerAuth()
@Controller('picks')
export class PicksController {
  constructor(private readonly picksService: PicksService) {}

  @UseGuards(AuthGuard)
  @Get()
  @ApiOperation({ summary: 'Get picks for the current user' })
  @ApiResponse({ status: 200, description: 'List of user picks.' })
  async get(@Req() req): Promise<PickDTO[]> {
    return await this.picksService.getUserPicks(req.user);
  }

  @UseGuards(AuthGuard)
  @Get('league')
  @ApiOperation({ summary: 'Get all picks for the league' })
  @ApiResponse({ status: 200, description: 'List of league picks.' })
  async getLeaguePicks(): Promise<PickDTO[]> {
    return await this.picksService.getLeaguePicks();
  }

  @UseGuards(AuthGuard)
  @Post()
  @ApiOperation({ summary: 'Save a pick for the current user' })
  @ApiResponse({ status: 201, description: 'Pick saved.' })
  async post(@Body() picksDto: any /*PickDTO*/, @Req() req): Promise<PickDTO> {
    return await this.picksService.saveUserPick(req.user, picksDto);
  }
}
