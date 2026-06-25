import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { FootballDataService } from './football-data.service';
import { FootballDataController } from './football-data.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FootballTeam } from './entities/football-team.entity';

@Module({
  imports: [HttpModule, TypeOrmModule.forFeature([FootballTeam]),],
  controllers: [FootballDataController],
  providers: [FootballDataService],
  exports: [FootballDataService],
})
export class FootballDataModule {}