import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UpdateBetDto } from './dto/update-bet.dto';
import { Bet } from './entities/bet.entity';
import { CreateBetDto } from './dto/create-bet.dto';
import { BankrollService } from '../bankroll/bankroll.service';
import { OddsService } from '../odds/odds.service';

@Injectable()
export class BetsService {
  constructor(
    @InjectRepository(Bet)
    private readonly betRepository: Repository<Bet>,
    private readonly bankrollService: BankrollService,
    private readonly oddsService: OddsService,
  ) { }

  async create(createBetDto: CreateBetDto, user: any): Promise<Bet> {
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
      user: {
        id: user.id,
      },
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
    relations: {
      user: true,
    },
  });

  if (!bet) {
    throw new NotFoundException(`Bet with id ${id} not found`);
  }

  if (bet.result !== 'pending') {
    await this.bankrollService.reverseAmount(
      Number(bet.profit),
      bet.user.id,
      bet.id,
    );
  }

  await this.betRepository.remove(bet);

  return {
    message: 'Bet deleted successfully',
  };
}

  async autoSettleMatchWinner(): Promise<any> {
    const pendingBets = await this.betRepository.find({
      where: {
        result: 'pending',
        marketKey: 'h2h',
      },
    });

    const settled: any[] = [];

    for (const bet of pendingBets) {

      console.log('BET:', {
        id: bet.id,
        oddsEventId: bet.oddsEventId,
        marketKey: bet.marketKey,
        selection: bet.selection,
      });

      if (!bet.oddsEventId) {
        continue;
      }
      const scores = await this.oddsService.getScores(
        'soccer_fifa_world_cup',
        bet.oddsEventId,
      );

      const event = scores?.[0];
      console.log('SCORE EVENT:', event);

      if (!event || !event.completed || !event.scores?.length) {
        continue;
      }

      const homeScore = Number(event.scores[0].score);
      const awayScore = Number(event.scores[1].score);

      let winningSelection = 'Draw';

      if (homeScore > awayScore) {
        winningSelection = event.home_team;
      }

      if (awayScore > homeScore) {
        winningSelection = event.away_team;
      }

      const result =
        bet.selection === winningSelection ? 'win' : 'loss';

      await this.updateResult(bet.id, result as 'win' | 'loss');

      settled.push({
        betId: bet.id,
        event: `${event.home_team} vs ${event.away_team}`,
        finalScore: `${homeScore}-${awayScore}`,
        selection: bet.selection,
        result,
      });
    }

    return {
      checked: pendingBets.length,
      settled: settled.length,
      details: settled,
    };
  }

 async findAll(filters?: any, userId?: number): Promise<Bet[]> {
  const query = this.betRepository
    .createQueryBuilder('bet')
    .where('bet.userId = :userId', { userId })
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

    await this.bankrollService.updateCurrentAmount(profit, bet.user.id, bet.id);

    return updatedBet;
  }
}