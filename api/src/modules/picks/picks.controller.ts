import { Controller, Get, Post, Body, Req } from '@nestjs/common';
import { PicksService } from './picks.service';
import { PickDTO } from 'libs';

@Controller('picks')
export class PicksController {
  constructor(private readonly picksService: PicksService) {}

  @Get()
  get(@Req() req) {
    return this.picksService.getUserPicks(req.user);
  }

  @Get('league')
  getLeaguePicks() {
    return this.picksService.getLeaguePicks();
  }

  @Post()
  post(@Body() picksDto: PickDTO, @Req() req) {
    return this.picksService.saveUserPick(req.user, picksDto);
  }
}
