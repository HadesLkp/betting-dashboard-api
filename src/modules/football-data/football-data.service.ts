import { Injectable, BadRequestException } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { FootballTeam } from './entities/football-team.entity';

@Injectable()
export class FootballDataService {
  private readonly baseUrl = 'https://v3.football.api-sports.io';

  constructor(
    private readonly httpService: HttpService,
    @InjectRepository(FootballTeam)
    private readonly footballTeamRepository: Repository<FootballTeam>,
  ) { }

  async searchTeam(name: string) {
    const apiKey = process.env.FOOTBALL_API_KEY;

    if (!apiKey) {
      throw new BadRequestException('FOOTBALL_API_KEY is not configured');
    }

    const response = await firstValueFrom(
      this.httpService.get(`${this.baseUrl}/teams`, {
        headers: {
          'x-apisports-key': apiKey,
        },
        params: {
          search: name,
        },
      }),
    );

    return response.data.response.map((item: any) => ({
      id: item.team.id,
      name: item.team.name,
      code: item.team.code,
      country: item.team.country,
      national: item.team.national,
      logo: item.team.logo,
    }));
  }

  private normalizeTeamName(name: string): string {
    const aliases: Record<string, string> = {
      'DR Congo': 'Congo DR',
      'Democratic Republic of Congo': 'Congo DR',
    };

    return aliases[name] || name;
  }

  async findOrCreateTeamByName(name: string) {
    const normalizedName = this.normalizeTeamName(name);

    const existingByName = await this.footballTeamRepository.findOne({
      where: {
        name: normalizedName,
      },
    });

    if (existingByName) {
      return existingByName;
    }

    const teams = await this.searchTeam(normalizedName);

    if (!teams.length) {
      return null;
    }

    const normalizedLower = normalizedName.toLowerCase();

    const apiTeam =
      teams.find((team: any) =>
        team.national === true &&
        team.name.toLowerCase() === normalizedLower
      ) ||
      teams.find((team: any) =>
        team.national === true &&
        team.name.toLowerCase().includes(normalizedLower)
      ) ||
      teams.find((team: any) => team.national === true) ||
      teams[0];

    const existingByApiId = await this.footballTeamRepository.findOne({
      where: {
        apiFootballId: apiTeam.id,
      },
    });

    if (existingByApiId) {
      return existingByApiId;
    }

    const team = this.footballTeamRepository.create({
      apiFootballId: apiTeam.id,
      name: apiTeam.name,
      code: apiTeam.code,
      country: apiTeam.country,
      national: apiTeam.national,
      logo: apiTeam.logo,
    });

    return this.footballTeamRepository.save(team);
  }

  async findFixtureByTeamsAndDate(homeTeamId: number, awayTeamId: number, commenceTime?: string) {
    const apiKey = process.env.FOOTBALL_API_KEY;

    if (!apiKey) {
      throw new BadRequestException('FOOTBALL_API_KEY is not configured');
    }

    const date = commenceTime
      ? commenceTime.split('T')[0]
      : undefined;

    if (!date) {
      return null;
    }

    const response = await firstValueFrom(
      this.httpService.get(`${this.baseUrl}/fixtures`, {
        headers: {
          'x-apisports-key': apiKey,
        },
        params: {
          team: homeTeamId,
          date,
        },
      }),
    );

    const fixtures = response.data.response || [];

    const fixture = fixtures.find((item: any) => {
      const homeId = item.teams.home.id;
      const awayId = item.teams.away.id;

      return (
        homeId === homeTeamId &&
        awayId === awayTeamId
      );
    });

    console.log('SEARCH FIXTURE PARAMS:', {
      homeTeamId,
      awayTeamId,
      commenceTime,
      date,
    });

    console.log('FIXTURES FOUND:', fixtures.map((item: any) => ({
      fixtureId: item.fixture.id,
      date: item.fixture.date,
      home: item.teams.home.name,
      homeId: item.teams.home.id,
      away: item.teams.away.name,
      awayId: item.teams.away.id,
    })));

    if (!fixture) {
      return null;
    }



    return {
      fixtureId: fixture.fixture.id,
      leagueId: fixture.league.id,
      season: fixture.league.season,
      leagueName: fixture.league.name,
      round: fixture.league.round,
      status: fixture.fixture.status.short,
    };
  }

  async resolveMatchTeams(
    homeTeam: string,
    awayTeam: string,
  ) {
    const home = await this.findOrCreateTeamByName(homeTeam);
    const away = await this.findOrCreateTeamByName(awayTeam);

    return {
      homeTeam: home,
      awayTeam: away,
    };
  }

  async getTeamLastMatches(teamId: number) {
    const apiKey = process.env.FOOTBALL_API_KEY;

    const response = await firstValueFrom(
      this.httpService.get(`${this.baseUrl}/fixtures`, {
        headers: {
          'x-apisports-key': apiKey,
        },
        params: {
          team: teamId,
          last: 5,
        },
      }),
    );



    const matches = response.data.response;

    return {
      teamId,
      form: this.calculateTeamForm(teamId, matches),
      matches: matches.map((item: any) => ({
        fixtureId: item.fixture.id,
        date: item.fixture.date,
        league: item.league.name,
        homeTeam: item.teams.home.name,
        awayTeam: item.teams.away.name,
        homeGoals: item.goals.home,
        awayGoals: item.goals.away,
      })),
    };
  }

  private getLeagueWeight(league: string): number {
    const weights: Record<string, number> = {
      'World Cup': 1.5,
      'Euro Championship': 1.5,
      'Copa America': 1.4,
      'UEFA Nations League': 1.3,
      'World Cup - Qualification': 1.2,
      'Friendlies': 1.0,
    };

    return weights[league] || 1;
  }

  async getMatchForm(homeTeamId: number, awayTeamId: number) {
    const homeData = await this.getTeamLastMatches(homeTeamId);
    const awayData = await this.getTeamLastMatches(awayTeamId);

    return {
      homeTeamId,
      awayTeamId,
      homeForm: homeData.form,
      awayForm: awayData.form,
      comparison: {
        formScoreDiff:
          homeData.form.formScore - awayData.form.formScore,
        avgGoalsForDiff:
          homeData.form.avgGoalsFor - awayData.form.avgGoalsFor,
        avgGoalsAgainstDiff:
          homeData.form.avgGoalsAgainst - awayData.form.avgGoalsAgainst,
      },
    };
  }

  async getHeadToHead(homeTeamId: number, awayTeamId: number) {
    const apiKey = process.env.FOOTBALL_API_KEY;

    const response = await firstValueFrom(
      this.httpService.get(`${this.baseUrl}/fixtures/headtohead`, {
        headers: {
          'x-apisports-key': apiKey,
        },
        params: {
          h2h: `${homeTeamId}-${awayTeamId}`,
        },
      }),
    );

    const matches = response.data.response;

    return {
      homeTeamId,
      awayTeamId,
      h2h: this.calculateHeadToHead(
        homeTeamId,
        awayTeamId,
        matches,
      ),
      matches: matches.map((item: any) => ({
        fixtureId: item.fixture.id,
        date: item.fixture.date,
        league: item.league.name,
        homeTeam: item.teams.home.name,
        awayTeam: item.teams.away.name,
        homeGoals: item.goals.home,
        awayGoals: item.goals.away,
      })),
    };
  }

  calculateHeadToHead(
    homeTeamId: number,
    awayTeamId: number,
    matches: any[],
  ) {
    let homeWins = 0;
    let awayWins = 0;
    let draws = 0;

    for (const match of matches) {
      const homeGoals =
        match.teams.home.id === homeTeamId
          ? match.goals.home
          : match.goals.away;

      const awayGoals =
        match.teams.home.id === awayTeamId
          ? match.goals.home
          : match.goals.away;

      if (homeGoals > awayGoals) {
        homeWins++;
      } else if (homeGoals < awayGoals) {
        awayWins++;
      } else {
        draws++;
      }
    }

    return {
      matches: matches.length,
      homeWins,
      awayWins,
      draws,
      homeH2HScore: homeWins * 3 + draws,
      awayH2HScore: awayWins * 3 + draws,
    };
  }

  calculateTeamForm(teamId: number, matches: any[]) {
    let wins = 0;
    let draws = 0;
    let losses = 0;
    let goalsFor = 0;
    let goalsAgainst = 0;
    let formScore = 0;
    let weightedFormScore = 0;

    for (const match of matches) {
      const isHome = match.teams.home.id === teamId;

      const teamGoals = isHome
        ? match.goals.home
        : match.goals.away;

      const opponentGoals = isHome
        ? match.goals.away
        : match.goals.home;

      const weight = this.getLeagueWeight(match.league.name);

      goalsFor += Number(teamGoals);
      goalsAgainst += Number(opponentGoals);

      if (teamGoals > opponentGoals) {
        wins++;
        formScore += 3;
        weightedFormScore += 3 * weight;
      } else if (teamGoals < opponentGoals) {
        losses++;
      } else {
        draws++;
        formScore += 1;
        weightedFormScore += 1 * weight;
      }
    }

    return {
      matches: matches.length,
      wins,
      draws,
      losses,
      goalsFor,
      goalsAgainst,
      avgGoalsFor: matches.length ? goalsFor / matches.length : 0,
      avgGoalsAgainst: matches.length ? goalsAgainst / matches.length : 0,
      formScore,
      weightedFormScore,
    };
  }
}