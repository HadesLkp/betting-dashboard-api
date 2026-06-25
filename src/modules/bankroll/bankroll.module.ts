import { Module } from '@nestjs/common';
import { BankrollHistory } from './entities/bankroll-history.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BankrollController } from './bankroll.controller';
import { BankrollService } from './bankroll.service';
import { Bankroll } from './entities/bankroll.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Bankroll,
      BankrollHistory,
    ]),
  ],
  controllers: [BankrollController],
  providers: [BankrollService],
  exports: [BankrollService],
})
export class BankrollModule {}