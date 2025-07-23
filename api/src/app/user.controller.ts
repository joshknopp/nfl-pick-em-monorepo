import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import { AuthGuard } from '../shared/guards/auth.guard';

@Controller('user')
export class UserController {
  @UseGuards(AuthGuard)
  @Get()
  getUser(@Req() req) {
    // Returns Firebase user info
    return req.user;
  }
}
