import { Injectable, BadRequestException } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';

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
          markets: 'h2h',
          oddsFormat: 'decimal',
        },
      }),
    );

    return response.data;
  }

  async getFormattedEvents(sport: string) {
    const events = await this.getEvents(sport);

    return events.map((event: any) => ({
      id: event.id,
      homeTeam: event.home_team,
      awayTeam: event.away_team,
      commenceTime: event.commence_time,
      bookmaker:
        event.bookmakers?.[0]?.title ?? null,

      outcomes:
        event.bookmakers?.[0]?.markets?.[0]?.outcomes ?? [],
    }));
  }

}