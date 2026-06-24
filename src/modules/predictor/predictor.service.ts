import { Injectable } from '@nestjs/common';
import { AnalyzePickDto } from './dto/analyze-pick.dto';
import { FootballDataService } from '../football-data/football-data.service';
import { AnalyzeWithModelDto } from './dto/analyze-with-model.dto';

@Injectable()
export class PredictorService {
  constructor(
    private readonly footballDataService: FootballDataService,
  ) { }

  analyzePick(dto: AnalyzePickDto) {
    const odds = Number(dto.odds);

    const impliedProbability = (1 / odds) * 100;

    let estimatedProbability = impliedProbability;

    if (dto.selection === dto.homeTeam) {
      estimatedProbability += 3;
    }

    if (dto.selection === dto.awayTeam) {
      estimatedProbability -= 1;
    }

    if (dto.selection.toLowerCase() === 'draw') {
      estimatedProbability += 0;
    }

    estimatedProbability = Math.max(
      1,
      Math.min(99, estimatedProbability),
    );

    const edge = estimatedProbability - impliedProbability;

    const recommendation =
      edge > 0 ? 'VALUE_BET' : 'NO_VALUE';

    return {
      homeTeam: dto.homeTeam,
      awayTeam: dto.awayTeam,
      market: dto.market,
      selection: dto.selection,
      odds,
      impliedProbability,
      estimatedProbability,
      edge,
      recommendation,
    };
  }

  async analyzeWithModel(dto: AnalyzeWithModelDto) {
    const prediction = await this.getMatchProbability(
      Number(dto.homeTeamId),
      Number(dto.awayTeamId),
    );

    let modelProbability = 0;

    if (dto.selectionType === 'HOME') {
      modelProbability =
        prediction.probabilities.homeWinProbability;
    }

    if (dto.selectionType === 'DRAW') {
      modelProbability =
        prediction.probabilities.drawProbability;
    }

    if (dto.selectionType === 'AWAY') {
      modelProbability =
        prediction.probabilities.awayWinProbability;
    }

    const odds = Number(dto.odds);
    const impliedProbability = (1 / odds) * 100;
    const edge = modelProbability - impliedProbability;

    const probability = modelProbability / 100;
    const b = odds - 1;
    const q = 1 - probability;

    const evPerUnit =
      probability * b - q;

    const kelly =
      b > 0
        ? (b * probability - q) / b
        : 0;

    const kellyPercentage =
      Math.max(kelly * 100, 0);

    const bankroll = 1000; // temporal
    const recommendedStake =
      bankroll * (kellyPercentage / 100);

    let rating = 'NO_VALUE';

    if (edge > 0 && edge < 2) {
      rating = 'SMALL';
    }

    if (edge >= 2 && edge < 5) {
      rating = 'GOOD';
    }

    if (edge >= 5 && edge < 10) {
      rating = 'VERY_GOOD';
    }

    if (edge >= 10) {
      rating = 'PREMIUM';
    }

    return {
      homeTeamId: dto.homeTeamId,
      awayTeamId: dto.awayTeamId,
      selectionType: dto.selectionType,
      odds,
      modelProbability,
      impliedProbability,
      edge,
      evPerUnit,
      kellyPercentage,
      recommendedStake,
      rating,
      recommendation: edge > 0 ? 'VALUE_BET' : 'NO_VALUE',
      prediction,
    };
  }

  async getMatchProbability(homeTeamId: number, awayTeamId: number) {
    const matchForm = await this.footballDataService.getMatchForm(
      homeTeamId,
      awayTeamId,
    );

    const h2hData = await this.footballDataService.getHeadToHead(
      homeTeamId,
      awayTeamId,
    );

    const probabilities = this.calculateMatchProbabilities(
      matchForm.homeForm,
      matchForm.awayForm,
      h2hData.h2h,
    );

    return {
      homeTeamId,
      awayTeamId,
      homeForm: matchForm.homeForm,
      awayForm: matchForm.awayForm,
      h2h: h2hData.h2h,
      comparison: matchForm.comparison,
      probabilities,
    };
  }

  calculateMatchProbabilities(
    homeForm: any,
    awayForm: any,
    h2h?: any,
  ) {
    const homeStrength =
      Number(homeForm.weightedFormScore) +
      Number(homeForm.avgGoalsFor) -
      Number(homeForm.avgGoalsAgainst);

    const awayStrength =
      Number(awayForm.weightedFormScore) +
      Number(awayForm.avgGoalsFor) -
      Number(awayForm.avgGoalsAgainst);

    let homeH2HBoost = 0;
    let awayH2HBoost = 0;

    if (h2h && h2h.matches > 0) {
      homeH2HBoost =
        (Number(h2h.homeH2HScore) / Number(h2h.matches)) * 0.5;

      awayH2HBoost =
        (Number(h2h.awayH2HScore) / Number(h2h.matches)) * 0.5;
    }

    const homeAdvantage = 1.08;

    const adjustedHomeStrength =
      (homeStrength + homeH2HBoost) * homeAdvantage;

    const adjustedAwayStrength =
      awayStrength + awayH2HBoost;

    const strengthDiff =
      adjustedHomeStrength - adjustedAwayStrength;

    let drawProbability = 25;

    if (Math.abs(strengthDiff) > 5) {
      drawProbability = 18;
    }

    if (Math.abs(strengthDiff) > 10) {
      drawProbability = 12;
    }

    const remainingProbability = 100 - drawProbability;

    const totalStrength =
      adjustedHomeStrength + adjustedAwayStrength;

    const homeWinProbability =
      totalStrength > 0
        ? (adjustedHomeStrength / totalStrength) * remainingProbability
        : remainingProbability / 2;

    const awayWinProbability =
      remainingProbability - homeWinProbability;

    return {
      homeStrength,
      awayStrength,
      homeH2HBoost,
      awayH2HBoost,
      adjustedHomeStrength,
      adjustedAwayStrength,
      strengthDiff,
      homeWinProbability: Number(homeWinProbability.toFixed(2)),
      drawProbability: Number(drawProbability.toFixed(2)),
      awayWinProbability: Number(awayWinProbability.toFixed(2)),
    };
  }
}