import { Injectable } from '@nestjs/common';
import { Bankroll } from '../bankroll/entities/bankroll.entity';
import { BankrollHistory } from '../bankroll/entities/bankroll-history.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Bet } from '../bets/entities/bet.entity';

@Injectable()
export class StatsService {
  constructor(
    @InjectRepository(Bet)
    private readonly betRepository: Repository<Bet>,

    @InjectRepository(Bankroll)
    private readonly bankrollRepository: Repository<Bankroll>,

    @InjectRepository(BankrollHistory)
    private readonly bankrollHistoryRepository: Repository<BankrollHistory>,
  ) { }

  async getDashboardStats() {
    const bets = await this.betRepository.find();

    const totalBets = bets.length;
    const settledBets = bets.filter((bet) => bet.result !== 'pending');
    const pendingBets = bets.filter((bet) => bet.result === 'pending');

    const wonBets = bets.filter((bet) => bet.result === 'win');
    const lostBets = bets.filter((bet) => bet.result === 'loss');
    const pushBets = bets.filter((bet) => bet.result === 'push');

    const totalStake = bets.reduce(
      (sum, bet) => sum + Number(bet.stake),
      0,
    );

    const settledStake = settledBets.reduce(
      (sum, bet) => sum + Number(bet.stake),
      0,
    );

    const totalProfit = bets.reduce(
      (sum, bet) => sum + Number(bet.profit),
      0,
    );

    const roi =
      settledStake > 0 ? (totalProfit / settledStake) * 100 : 0;

    const winRate =
      settledBets.length > 0
        ? (wonBets.length / settledBets.length) * 100
        : 0;

    const bankrolls = await this.bankrollRepository.find({
      order: {
        id: 'DESC',
      },
      take: 1,
    });

    const bankroll = bankrolls[0];

    const initialBankroll = bankroll
      ? Number(bankroll.initialAmount)
      : 0;

    const currentBankroll = bankroll
      ? Number(bankroll.currentAmount)
      : 0;

    const bankrollGrowth =
      currentBankroll - initialBankroll;

    const bankrollHistory = await this.bankrollHistoryRepository.find({
      order: {
        createdAt: 'ASC',
      },
    });

    const sportsMap = new Map<
      string,
      {
        sport: string;
        bets: number;
        settled: number;
        won: number;
        lost: number;
        push: number;
        stake: number;
        profit: number;
      }
    >();

    for (const bet of bets) {
      const sport = bet.sport;

      if (!sportsMap.has(sport)) {
        sportsMap.set(sport, {
          sport,
          bets: 0,
          settled: 0,
          won: 0,
          lost: 0,
          push: 0,
          stake: 0,
          profit: 0,
        });
      }

      const item = sportsMap.get(sport);

      item.bets += 1;
      item.stake += Number(bet.stake);
      item.profit += Number(bet.profit);

      if (bet.result !== 'pending') {
        item.settled += 1;
      }

      if (bet.result === 'win') {
        item.won += 1;
      }

      if (bet.result === 'loss') {
        item.lost += 1;
      }

      if (bet.result === 'push') {
        item.push += 1;
      }
    }

    const sports = Array.from(sportsMap.values()).map((item) => ({
      ...item,
      roi: item.stake > 0 ? (item.profit / item.stake) * 100 : 0,
      winRate: item.settled > 0 ? (item.won / item.settled) * 100 : 0,
    }));

    const marketsMap = new Map<
      string,
      {
        market: string;
        bets: number;
        settled: number;
        won: number;
        lost: number;
        push: number;
        stake: number;
        profit: number;
      }
    >();

    for (const bet of bets) {
      const market = bet.market;

      if (!marketsMap.has(market)) {
        marketsMap.set(market, {
          market,
          bets: 0,
          settled: 0,
          won: 0,
          lost: 0,
          push: 0,
          stake: 0,
          profit: 0,
        });
      }

      const item = marketsMap.get(market);

      item.bets += 1;
      item.stake += Number(bet.stake);
      item.profit += Number(bet.profit);

      if (bet.result !== 'pending') {
        item.settled += 1;
      }

      if (bet.result === 'win') {
        item.won += 1;
      }

      if (bet.result === 'loss') {
        item.lost += 1;
      }

      if (bet.result === 'push') {
        item.push += 1;
      }
    }

    const markets = Array.from(marketsMap.values()).map((item) => ({
      ...item,
      roi: item.stake > 0 ? (item.profit / item.stake) * 100 : 0,
      winRate: item.settled > 0 ? (item.won / item.settled) * 100 : 0,
    }));

    return {
      bankroll: {
        initial: initialBankroll,
        current: currentBankroll,
        growth: bankrollGrowth,
      },

      performance: {
        roi,
        winRate,
      },

      bets: {
        total: totalBets,
        settled: settledBets.length,
        pending: pendingBets.length,
        won: wonBets.length,
        lost: lostBets.length,
        push: pushBets.length,
      },

      money: {
        totalStake,
        settledStake,
        totalProfit,
      },

      history: bankrollHistory,
      sports,
      markets
    };
  }
}