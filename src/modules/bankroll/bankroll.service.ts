import { Injectable, BadRequestException } from '@nestjs/common';
import { BankrollHistory } from './entities/bankroll-history.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Bankroll } from './entities/bankroll.entity';
import { CreateBankrollDto } from './dto/create-bankroll.dto';

@Injectable()
export class BankrollService {
  constructor(
    @InjectRepository(Bankroll)
    private readonly bankrollRepository: Repository<Bankroll>,

    @InjectRepository(BankrollHistory)
    private readonly bankrollHistoryRepository: Repository<BankrollHistory>,
  ) { }

  async create(createBankrollDto: CreateBankrollDto) {
    const existing = await this.bankrollRepository.find({
      order: {
        id: 'DESC',
      },
      take: 1,
    });

    if (existing.length > 0) {
      throw new BadRequestException(
        'A bankroll already exists',
      );
    }

    const bankroll = this.bankrollRepository.create({
      initialAmount: createBankrollDto.initialAmount,
      currentAmount: createBankrollDto.initialAmount,
    });

    return this.bankrollRepository.save(bankroll);
  }

  async getCurrent() {
    const bankrolls = await this.bankrollRepository.find({
      order: {
        id: 'DESC',
      },
      take: 1,
    });

    return bankrolls[0] ?? null;
  }

  async reverseAmount(amount: number, betId: number) {
  const bankroll = await this.getCurrent();

  if (!bankroll) {
    throw new BadRequestException('No bankroll exists');
  }

  bankroll.currentAmount =
    Number(bankroll.currentAmount) - Number(amount);

  const updatedBankroll =
    await this.bankrollRepository.save(bankroll);

  await this.bankrollHistoryRepository.delete({
    betId,
  });

  return updatedBankroll;
}

  async updateCurrentAmount(amount: number, betId?: number) {
    const bankroll = await this.getCurrent();

    if (!bankroll) {
      throw new BadRequestException('No bankroll exists');
    }

    bankroll.currentAmount =
      Number(bankroll.currentAmount) + Number(amount);

    const updatedBankroll =
      await this.bankrollRepository.save(bankroll);

    const history = this.bankrollHistoryRepository.create({
      bankrollId: updatedBankroll.id,
      amount: updatedBankroll.currentAmount,
      profit: amount,
      betId,
    });

    await this.bankrollHistoryRepository.save(history);

    return updatedBankroll;
  }

  async getHistory() {
    return this.bankrollHistoryRepository.find({
      order: {
        createdAt: 'ASC',
      },
    });
  }
  
}