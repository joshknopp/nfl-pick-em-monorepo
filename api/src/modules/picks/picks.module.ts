import { Module } from '@nestjs/common';
import { PicksController } from './picks.controller';
import { PicksService } from './picks.service';

@Module({
  controllers: [PicksController],
  providers: [PicksService],
})
export class PicksModule {}
