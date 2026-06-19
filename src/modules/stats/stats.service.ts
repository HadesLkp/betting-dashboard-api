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

  async getPortfolio() {
    const pendingBets = await this.betRepository.find({
      where: {
        result: 'pending',
      },
    });

    const openBets = pendingBets.length;

    const pendingStake = pendingBets.reduce(
      (sum, bet) => sum + Number(bet.stake),
      0,
    );

    const potentialProfit = pendingBets.reduce(
      (sum, bet) =>
        sum + ((Number(bet.stake) * Number(bet.odds)) - Number(bet.stake)),
      0,
    );

    const portfolioEv = pendingBets.reduce((sum, bet) => {
      const odds = Number(bet.odds);
      const probability = Number(bet.estimatedProbability) / 100;
      const stake = Number(bet.stake);

      const evPerUnit =
        probability * (odds - 1) - (1 - probability);

      return sum + stake * evPerUnit;
    }, 0);

    const openValueBets = pendingBets.filter((bet) => {
      const odds = Number(bet.odds);
      const estimatedProbability = Number(bet.estimatedProbability);
      const impliedProbability = (1 / odds) * 100;

      return estimatedProbability > impliedProbability;
    }).length;

    const kellyValues = pendingBets.map((bet) => {
      const odds = Number(bet.odds);
      const probability = Number(bet.estimatedProbability) / 100;

      const b = odds - 1;
      const q = 1 - probability;

      if (b <= 0) {
        return 0;
      }

      const kelly = (b * probability - q) / b;

      return Math.max(kelly * 100, 0);
    });

    const exposureBySport = pendingBets.reduce((acc, bet) => {
      const sport = bet.sport || 'UNKNOWN';
      const stake = Number(bet.stake);

      acc[sport] = (acc[sport] || 0) + stake;

      return acc;
    }, {} as Record<string, number>);

    const exposureByMarket = pendingBets.reduce((acc, bet) => {
      const market = bet.market || 'UNKNOWN';
      const stake = Number(bet.stake);

      acc[market] = (acc[market] || 0) + stake;

      return acc;
    }, {} as Record<string, number>);

    const averageKelly =
      kellyValues.length > 0
        ? kellyValues.reduce((sum, value) => sum + value, 0) /
        kellyValues.length
        : 0;

    const bankrolls = await this.bankrollRepository.find({
      order: {
        id: 'DESC',
      },
      take: 1,
    });

    const bankroll = bankrolls[0];

    const currentBankroll = bankroll
      ? Number(bankroll.currentAmount)
      : 0;

    const riskPercentage =
      currentBankroll > 0
        ? (pendingStake / currentBankroll) * 100
        : 0;

    let riskLevel = 'LOW';

    if (riskPercentage >= 20) {
      riskLevel = 'MEDIUM';
    }

    if (riskPercentage >= 40) {
      riskLevel = 'HIGH';
    }

    return {
      openBets,
      pendingStake,
      potentialProfit,
      portfolioEv,
      openValueBets,
      averageKelly,
      exposureBySport,
      exposureByMarket,
      currentBankroll,
      riskPercentage,
      riskLevel,
    };
  }
}