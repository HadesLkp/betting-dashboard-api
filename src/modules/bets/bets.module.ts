import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BetsService } from './bets.service';
import { BetsController } from './bets.controller';
import { Bet } from './entities/bet.entity';
import { BankrollModule } from '../bankroll/bankroll.module';

@Module({
  imports: [TypeOrmModule.forFeature([Bet]), 
  BankrollModule],
  controllers: [BetsController],
  providers: [BetsService],
})
export class BetsModule {}