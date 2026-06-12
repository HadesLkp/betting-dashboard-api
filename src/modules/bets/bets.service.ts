import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UpdateBetDto } from './dto/update-bet.dto';
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

  async update(id: number, updateBetDto: UpdateBetDto): Promise<Bet> {
    const bet = await this.betRepository.findOne({
      where: { id },
    });

    if (!bet) {
      throw new NotFoundException(`Bet with id ${id} not found`);
    }

    if (bet.result !== 'pending') {
      throw new BadRequestException(
        'Only pending bets can be edited',
      );
    }

    const odds = updateBetDto.odds ?? Number(bet.odds);
    const stake = updateBetDto.stake ?? Number(bet.stake);
    const estimatedProbability =
      updateBetDto.estimatedProbability ??
      Number(bet.estimatedProbability);

    const impliedProbability = (1 / Number(odds)) * 100;

    const expectedValue =
      (Number(estimatedProbability) / 100) *
      (Number(odds) * Number(stake) - Number(stake)) -
      (1 - Number(estimatedProbability) / 100) *
      Number(stake);

    Object.assign(bet, {
      ...updateBetDto,
      impliedProbability,
      expectedValue,
    });

    return this.betRepository.save(bet);
  }

  async remove(id: number): Promise<{ message: string }> {
    const bet = await this.betRepository.findOne({
      where: { id },
    });

    if (!bet) {
      throw new NotFoundException(`Bet with id ${id} not found`);
    }

    if (bet.result !== 'pending') {
      await this.bankrollService.reverseAmount(
        Number(bet.profit),
        bet.id,
      );
    }

    await this.betRepository.remove(bet);

    return {
      message: 'Bet deleted successfully',
    };
  }

  async findAll(filters?: {
    sport?: string;
    market?: string;
    result?: string;
    from?: string;
    to?: string;
  }): Promise<Bet[]> {
    const query = this.betRepository
      .createQueryBuilder('bet')
      .orderBy('bet.placedAt', 'DESC');

    if (filters?.sport) {
      query.andWhere('LOWER(bet.sport) = LOWER(:sport)', {
        sport: filters.sport,
      });
    }

    if (filters?.market) {
      query.andWhere('bet.market = :market', {
        market: filters.market,
      });
    }

    if (filters?.result) {
      query.andWhere('bet.result = :result', {
        result: filters.result,
      });
    }

    if (filters?.from) {
      query.andWhere('bet.placedAt >= :from', {
        from: filters.from,
      });
    }

    if (filters?.to) {
      query.andWhere('bet.placedAt <= :to', {
        to: filters.to,
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