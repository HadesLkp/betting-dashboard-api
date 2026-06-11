import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Bet } from './entities/bet.entity';
import { CreateBetDto } from './dto/create-bet.dto';
import { BankrollService } from '../bankroll/bankroll.service';

@Injectable()
export class BetsService {
  constructor(
    @InjectRepository(Bet)
    private readonly betRepository: Repository<Bet>,
    private readonly bankrollService: BankrollService,
  ) { }

  async create(createBetDto: CreateBetDto): Promise<Bet> {
    const impliedProbability = (1 / createBetDto.odds) * 100;

    const expectedValue =
      (createBetDto.estimatedProbability / 100) *
      (createBetDto.odds * createBetDto.stake - createBetDto.stake) -
      (1 - createBetDto.estimatedProbability / 100) * createBetDto.stake;

    const bet = this.betRepository.create({
      ...createBetDto,
      impliedProbability,
      expectedValue,
      result: 'pending',
      profit: 0,
    });

    return this.betRepository.save(bet);
  }

  async findAll(filters?: {
    sport?: string;
    result?: string;
  }): Promise<Bet[]> {
    const query = this.betRepository
      .createQueryBuilder('bet')
      .orderBy('bet.placedAt', 'DESC');

    if (filters?.sport) {
      query.andWhere('LOWER(bet.sport) = LOWER(:sport)', {
        sport: filters.sport,
      });
    }

    if (filters?.result) {
      query.andWhere('bet.result = :result', {
        result: filters.result,
      });
    }

    return query.getMany();
  }

  async updateResult(id: number, result: 'win' | 'loss' | 'push'): Promise<Bet> {
    const bet = await this.betRepository.findOne({
      where: { id },
    });

    if (!bet) {
      throw new NotFoundException(`Bet with id ${id} not found`);
    }

    if (bet.result !== 'pending') {
      throw new BadRequestException(
        'Bet already settled',
      );
    }

    let profit = 0;

    if (result === 'win') {
      profit = Number(bet.stake) * (Number(bet.odds) - 1);
    }

    if (result === 'loss') {
      profit = -Number(bet.stake);
    }

    if (result === 'push') {
      profit = 0;
    }

    bet.result = result;
    bet.profit = profit;

    const updatedBet = await this.betRepository.save(bet);

    await this.bankrollService.updateCurrentAmount(profit, bet.id);

    return updatedBet;
  }
}