import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { FootballDataService } from './football-data.service';
import { FootballDataController } from './football-data.controller';

@Module({
  imports: [HttpModule],
  controllers: [FootballDataController],
  providers: [FootballDataService],
  exports: [FootballDataService],
})
export class FootballDataModule {}