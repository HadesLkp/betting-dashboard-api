import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { OddsController } from './odds.controller';
import { OddsService } from './odds.service';

@Module({
  imports: [HttpModule],
  controllers: [OddsController],
  providers: [OddsService],
})
export class OddsModule {}