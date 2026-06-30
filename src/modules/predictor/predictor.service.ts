import { Injectable } from '@nestjs/common';
import { AnalyzePickDto } from './dto/analyze-pick.dto';
import { FootballDataService } from '../football-data/football-data.service';
import { AnalyzeWithModelDto } from './dto/analyze-with-model.dto';
import { BankrollService } from '../bankroll/bankroll.service';
import { AnalyzeEventDto } from './dto/analyze-event.dto';

@Injectable()
export class PredictorService {
  constructor(
    private readonly footballDataService: FootballDataService,
    private readonly bankrollService: BankrollService,
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

  async analyzeWithModel(dto: AnalyzeWithModelDto, userId: number) {
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

    const bankroll = await this.bankrollService.getCurrent(userId);

    const currentBankroll = bankroll
      ? Number(bankroll.currentAmount)
      : 0;
    const recommendedStake =
      currentBankroll * (kellyPercentage / 100);

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

    const baseResult = {
      homeTeamId: dto.homeTeamId,
      awayTeamId: dto.awayTeamId,
      selectionType: dto.selectionType,
      odds,
      modelProbability,
      impliedProbability,
      edge,
      evPerUnit,
      currentBankroll,
      kellyPercentage,
      recommendedStake,
      rating,
      recommendation: edge > 0 ? 'VALUE_BET' : 'NO_VALUE',
      prediction,
    };

    return {
      ...baseResult,
      explanation: this.buildSelectionExplanation(baseResult)
    };
  }

  buildPositiveExplanation(result: any) {
    const reasons: string[] = [];

    const homeForm = result.prediction.homeForm;
    const awayForm = result.prediction.awayForm;
    const comparison = result.prediction.comparison;

    if (comparison.formScoreDiff > 3) {
      reasons.push(
        'El equipo seleccionado llega con mejor forma reciente.',
      );
    }

    if (homeForm.avgGoalsFor > awayForm.avgGoalsFor) {
      reasons.push(
        `El equipo seleccionado promedia más goles: ${homeForm.avgGoalsFor.toFixed(1)} vs ${awayForm.avgGoalsFor.toFixed(1)}.`,
      );
    }

    if (homeForm.avgGoalsAgainst < awayForm.avgGoalsAgainst) {
      reasons.push(
        `El equipo seleccionado recibe menos goles: ${homeForm.avgGoalsAgainst.toFixed(1)} vs ${awayForm.avgGoalsAgainst.toFixed(1)}.`,
      );
    }

    if (result.edge > 0) {
      reasons.push(
        'La probabilidad del modelo supera la probabilidad implícita del mercado.',
      );
    }

    return reasons;
  }

  async analyzeEvent(dto: AnalyzeEventDto, userId: number) {
  console.log('DTO ANALYZE EVENT:', dto);

  const teams =
    await this.footballDataService.resolveMatchTeams(
      dto.homeTeam,
      dto.awayTeam,
    );

  console.log('TEAMS RESOLVED:', teams);

  if (!teams.homeTeam || !teams.awayTeam) {
    return {
      message: 'Could not resolve teams',
      teams,
    };
  }

  const fixture =
    await this.footballDataService.findFixtureByTeamsAndDate(
      teams.homeTeam.apiFootballId,
      teams.awayTeam.apiFootballId,
      dto.commenceTime,
    );

  console.log('FIXTURE RESOLVED:', fixture);

  const result = await this.analyzeWithModel(
    {
      homeTeamId: teams.homeTeam.apiFootballId,
      awayTeamId: teams.awayTeam.apiFootballId,
      selectionType: dto.selectionType,
      odds: dto.odds,
    },
    userId,
  );

  return {
    ...result,
    teams,
    fixture,
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

    let homeWinProbability =
      totalStrength > 0
        ? (adjustedHomeStrength / totalStrength) * remainingProbability
        : remainingProbability / 2;

    let awayWinProbability =
      remainingProbability - homeWinProbability;

    // Evitar probabilidades negativas o absurdas
    homeWinProbability = Math.max(
      1,
      Math.min(95, homeWinProbability),
    );

    awayWinProbability = Math.max(
      1,
      Math.min(95, awayWinProbability),
    );

    drawProbability = Math.max(
      1,
      Math.min(60, drawProbability),
    );

    // Normalizar para que todo vuelva a sumar 100
    const totalProbability =
      homeWinProbability +
      drawProbability +
      awayWinProbability;

    const normalizedHome =
      (homeWinProbability / totalProbability) * 100;

    const normalizedDraw =
      (drawProbability / totalProbability) * 100;

    const normalizedAway =
      (awayWinProbability / totalProbability) * 100;

    return {
      homeStrength,
      awayStrength,
      homeH2HBoost,
      awayH2HBoost,
      adjustedHomeStrength,
      adjustedAwayStrength,
      strengthDiff,
      homeWinProbability: Number(normalizedHome.toFixed(2)),
      drawProbability: Number(normalizedDraw.toFixed(2)),
      awayWinProbability: Number(normalizedAway.toFixed(2)),
    };
  }

  buildSelectionExplanation(result: any) {
    const strengths: string[] = [];
    const weaknesses: string[] = [];

    const {
      selectionType,
      modelProbability,
      edge,
      prediction,
    } = result;

    const homeForm = prediction.homeForm;
    const awayForm = prediction.awayForm;
    const comparison = prediction.comparison;

    const selectedForm =
      selectionType === 'HOME' ? homeForm : awayForm;

    const opponentForm =
      selectionType === 'HOME' ? awayForm : homeForm;

    const selectedLabel =
      selectionType === 'HOME'
        ? 'El equipo local'
        : selectionType === 'AWAY'
          ? 'El equipo visitante'
          : 'El empate';

    if (selectionType === 'DRAW') {
      if (Math.abs(comparison.formScoreDiff) <= 3) {
        strengths.push(
          'Los equipos llegan con una diferencia de forma relativamente equilibrada.',
        );
      } else {
        weaknesses.push(
          'Hay una diferencia importante de forma entre ambos equipos, lo que reduce la fuerza del empate.',
        );
      }

      if (modelProbability < 25) {
        weaknesses.push(
          `El modelo solo asigna ${modelProbability.toFixed(2)}% de probabilidad al empate.`,
        );
      }
    } else {
      if (selectedForm.formScore > opponentForm.formScore) {
        strengths.push(
          `${selectedLabel} llega con mejor forma reciente.`,
        );
      } else {
        weaknesses.push(
          `${selectedLabel} llega con peor forma reciente que su rival.`,
        );
      }

      if (selectedForm.avgGoalsFor > opponentForm.avgGoalsFor) {
        strengths.push(
          `${selectedLabel} promedia más goles: ${selectedForm.avgGoalsFor.toFixed(1)} vs ${opponentForm.avgGoalsFor.toFixed(1)}.`,
        );
      } else {
        weaknesses.push(
          `${selectedLabel} promedia menos goles: ${selectedForm.avgGoalsFor.toFixed(1)} vs ${opponentForm.avgGoalsFor.toFixed(1)}.`,
        );
      }

      if (selectedForm.avgGoalsAgainst < opponentForm.avgGoalsAgainst) {
        strengths.push(
          `${selectedLabel} recibe menos goles: ${selectedForm.avgGoalsAgainst.toFixed(1)} vs ${opponentForm.avgGoalsAgainst.toFixed(1)}.`,
        );
      } else {
        weaknesses.push(
          `${selectedLabel} recibe más goles: ${selectedForm.avgGoalsAgainst.toFixed(1)} vs ${opponentForm.avgGoalsAgainst.toFixed(1)}.`,
        );
      }

      if (modelProbability < 30) {
        weaknesses.push(
          `El modelo asigna una probabilidad baja a esta selección: ${modelProbability.toFixed(2)}%.`,
        );
      }
    }

    if (edge > 0) {
      strengths.push(
        'La probabilidad del modelo supera la probabilidad implícita del mercado.',
      );
    } else {
      weaknesses.push(
        'La cuota no ofrece valor frente a la probabilidad calculada por el modelo.',
      );
    }

    return {
      strengths,
      weaknesses,
    };
  }
}