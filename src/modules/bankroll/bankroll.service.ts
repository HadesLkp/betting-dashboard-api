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
  ) {}

  async create(
    createBankrollDto: CreateBankrollDto,
    userId: number,
  ) {
    const existing = await this.bankrollRepository.findOne({
      where: {
        user: {
          id: userId,
        },
      },
    });

    if (existing) {
      throw new BadRequestException(
        'A bankroll already exists',
      );
    }

    const bankroll = this.bankrollRepository.create({
      initialAmount: createBankrollDto.initialAmount,
      currentAmount: createBankrollDto.initialAmount,
      user: {
        id: userId,
      },
    });

    return this.bankrollRepository.save(bankroll);
  }

  async getCurrent(userId: number) {
    const bankroll = await this.bankrollRepository.findOne({
      where: {
        user: {
          id: userId,
        },
      },
      order: {
        id: 'DESC',
      },
    });

    return bankroll;
  }

  async updateCurrentAmount(
    amount: number,
    userId: number,
    betId?: number,
  ) {
    const bankroll = await this.getCurrent(userId);

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

  async reverseAmount(
    amount: number,
    userId: number,
    betId: number,
  ) {
    const bankroll = await this.getCurrent(userId);

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

  async getHistory(userId: number) {
    const bankroll = await this.getCurrent(userId);

    if (!bankroll) {
      return [];
    }

    return this.bankrollHistoryRepository.find({
      where: {
        bankrollId: bankroll.id,
      },
      order: {
        createdAt: 'ASC',
      },
    });
  }
}