import { Controller, Get, Query } from '@nestjs/common';
import { OddsService } from './odds.service';

@Controller('odds')
export class OddsController {
  constructor(private readonly oddsService: OddsService) { }

  @Get('sports')
  getSports() {
    return this.oddsService.getSports();
  }

  @Get('events')
  getEvents(@Query('sport') sport: string) {
    return this.oddsService.getEvents(sport);
  }

  @Get('formatted-events')
  getFormattedEvents(
    @Query('sport') sport: string,
  ) {
    return this.oddsService.getFormattedEvents(
      sport,
    );
  }

  @Get('scores')
  getScores(
    @Query('sport') sport: string,
    @Query('eventIds') eventIds?: string,
  ) {
    return this.oddsService.getScores(sport, eventIds);
  }
}