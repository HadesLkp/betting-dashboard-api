import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BetsService } from './bets.service';
import { BetsController } from './bets.controller';
import { Bet } from './entities/bet.entity';
import { BankrollModule } from '../bankroll/bankroll.module';
import { OddsModule } from '../odds/odds.module';
import { FootballDataModule } from '../football-data/football-data.module';

@Module({
  imports: [TypeOrmModule.forFeature([Bet]), 
  BankrollModule,
  OddsModule,
  FootballDataModule],
  controllers: [BetsController],
  providers: [BetsService],
})
export class BetsModule {}