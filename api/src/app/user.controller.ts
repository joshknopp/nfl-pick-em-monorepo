import { Controller, Get, Post, Put, Req, Body, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { UserService } from './user.service';
import { AuthGuard } from '../shared/guards/auth.guard';

@ApiTags('User')
@ApiBearerAuth()
@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

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
  async getUser(@Req() req) {
    const uid = req.user?.uid;
    if (uid) {
      await this.userService.activateUser(uid);
    }
    return req.user;
  }

  @UseGuards(AuthGuard)
  @Get('username')
  @ApiOperation({ summary: 'Get the username for the logged-in user' })
  async getUsername(@Req() req) {
    const uid = req.user?.uid;
    if (!uid) return { error: 'No user found' };
    const username = await this.userService.getUsername(uid);
    return { username };
  }

  @UseGuards(AuthGuard)
  @Put('username')
  @ApiOperation({ summary: 'Set the username for the logged-in user' })
  async setUsername(@Req() req, @Body('username') username: string) {
    const uid = req.user?.uid;
    if (!uid) return { error: 'No user found' };
    if (!username || username.length < 3 || username.length > 20) {
      return { error: 'Username must be 3-20 characters.' };
    }
    await this.userService.setUsername(uid, username);
    return { success: true };
  }

  @UseGuards(AuthGuard)
  @Post('activate')
  @ApiOperation({ summary: 'Activate the authenticated user' })
  async activateUser(@Req() req) {
    const uid = req.user?.uid;
    if (!uid) return { error: 'No user found' };
    await this.userService.activateUser(uid);
    return { success: true };
  }

  @UseGuards(AuthGuard)
  @Post('deactivate-all')
  @ApiOperation({ summary: 'Deactivate all users (clean slate for new season)' })
  async deactivateAllUsers() {
    return await this.userService.deactivateAllUsers();
  }
}
