import { Module } from '@nestjs/common';
import { PredictorService } from './predictor.service';
import { PredictorController } from './predictor.controller';
import { FootballDataModule } from '../football-data/football-data.module';
import { BankrollModule } from '../bankroll/bankroll.module';

@Module({
  providers: [PredictorService],
  controllers: [PredictorController],
  imports: [FootballDataModule, BankrollModule],
})
export class PredictorModule {}
