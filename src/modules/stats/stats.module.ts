import { Module } from '@nestjs/common';
import { Bankroll } from '../bankroll/entities/bankroll.entity';
import { BankrollHistory } from '../bankroll/entities/bankroll-history.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StatsController } from './stats.controller';
import { StatsService } from './stats.service';
import { Bet } from '../bets/entities/bet.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Bet, Bankroll, BankrollHistory])],
  controllers: [StatsController],
  providers: [StatsService],
})
export class StatsModule {}