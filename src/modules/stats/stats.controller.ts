import { Controller, Get } from '@nestjs/common';
import { StatsService } from './stats.service';

@Controller('stats')
export class StatsController {
  constructor(private readonly statsService: StatsService) { }

  @Get()
  getDashboardStats() {
    return this.statsService.getDashboardStats();
  }

  @Get('portfolio')
  getPortfolio() {
    return this.statsService.getPortfolio();
  }
}