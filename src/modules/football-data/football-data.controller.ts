import { Controller, Get, Query } from '@nestjs/common';
import { FootballDataService } from './football-data.service';

@Controller('football-data')
export class FootballDataController {
  constructor(
    private readonly footballDataService: FootballDataService,
  ) { }

  @Get('search-team')
  searchTeam(@Query('name') name: string) {
    return this.footballDataService.searchTeam(name);
  }

  @Get('team-last-matches')
  getTeamLastMatches(@Query('teamId') teamId: string) {
    return this.footballDataService.getTeamLastMatches(
      Number(teamId),
    );
  }

  @Get('head-to-head')
  getHeadToHead(
    @Query('homeTeamId') homeTeamId: string,
    @Query('awayTeamId') awayTeamId: string,
  ) {
    return this.footballDataService.getHeadToHead(
      Number(homeTeamId),
      Number(awayTeamId),
    );
  }

  @Get('match-form')
  getMatchForm(
    @Query('homeTeamId') homeTeamId: string,
    @Query('awayTeamId') awayTeamId: string,
  ) {
    return this.footballDataService.getMatchForm(
      Number(homeTeamId),
      Number(awayTeamId),
    );
  }
}