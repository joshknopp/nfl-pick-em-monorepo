import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { AuthGuard } from '../shared/guards/auth.guard';

@ApiTags('User')
@ApiBearerAuth()
@Controller('user')
export class UserController {
  @UseGuards(AuthGuard)
  @Get()
  @ApiOperation({ summary: 'Get the authenticated Firebase user info' })
  @ApiResponse({
    status: 200,
    description: 'Returns the Firebase user info attached to the request.',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized. Bearer token missing or invalid.',
  })
  getUser(@Req() req) {
    // Returns Firebase user info
    return req.user;
  }
}
