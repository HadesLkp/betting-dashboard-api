import { Injectable, BadRequestException } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { worldCupMockEvents } from './mocks/worldcup.mock';

@Injectable()
export class OddsService {
  private readonly baseUrl = 'https://api.the-odds-api.com/v4';

  constructor(private readonly httpService: HttpService) { }

  async getSports() {
    const apiKey = process.env.ODDS_API_KEY;

    if (!apiKey) {
      throw new BadRequestException('ODDS_API_KEY is not configured');
    }

    const response = await firstValueFrom(
      this.httpService.get(`${this.baseUrl}/sports`, {
        params: {
          apiKey,
        },
      }),
    );

    return response.data;
  }

  async getEvents(sport: string) {
    const apiKey = process.env.ODDS_API_KEY;

    if (!apiKey) {
      throw new BadRequestException('ODDS_API_KEY is not configured');
    }

    const response = await firstValueFrom(
      this.httpService.get(`${this.baseUrl}/sports/${sport}/odds`, {
        params: {
          apiKey,
          regions: 'us',
          markets: 'h2h,spreads,totals',
          oddsFormat: 'decimal',
        },
      }),
    );

    return response.data;
  }

  /* async getFormattedEvents(sport: string) {
  const events = await this.getEvents(sport);

  return events.map((event: any) => ({
    id: event.id,
    homeTeam: event.home_team,
    awayTeam: event.away_team,
    commenceTime: event.commence_time,
    bookmaker: event.bookmakers?.[0]?.title ?? null,
    markets: event.bookmakers?.[0]?.markets ?? [],
  }));
} */

async getFormattedEvents(sport: string) {
  const useMockOdds = process.env.USE_MOCK_ODDS === 'true';

  if (useMockOdds) {
    return worldCupMockEvents;
  }

  const events = await this.getEvents(sport);

  return events.map((event: any) => ({
    id: event.id,
    homeTeam: event.home_team,
    awayTeam: event.away_team,
    commenceTime: event.commence_time,
    bookmaker: event.bookmakers?.[0]?.title ?? null,
    markets: event.bookmakers?.[0]?.markets ?? [],
  }));
}

async getScores(sport: string, eventIds?: string) {
  const apiKey = process.env.ODDS_API_KEY;

  if (!apiKey) {
    throw new BadRequestException('ODDS_API_KEY is not configured');
  }

  const response = await firstValueFrom(
    this.httpService.get(`${this.baseUrl}/sports/${sport}/scores`, {
      params: {
        apiKey,
        daysFrom: 3,
        eventIds,
      },
    }),
  );

  return response.data;
}

}