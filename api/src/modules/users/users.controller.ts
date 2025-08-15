import { Controller, Get, Put, Body, Param, UseGuards } from '@nestjs/common';
import { UsersService } from './users.service';
import { AuthGuard } from '../../shared/guards/auth.guard';

@Controller('users')
export class UsersController {
	constructor(private readonly usersService: UsersService) {}

	@UseGuards(AuthGuard)
	@Get(':uid/username')
	async getUsername(@Param('uid') uid: string) {
		return { username: await this.usersService.getUsername(uid) };
	}

	@UseGuards(AuthGuard)
	@Put(':uid/username')
	async setUsername(@Param('uid') uid: string, @Body('username') username: string) {
		if (!username || username.length > 20) {
			return { error: 'Username must be 1-20 characters.' };
		}
		await this.usersService.setUsername(uid, username);
		return { success: true };
	}
}
