import {
  Controller,
  Get,
  Req,
  UseGuards,
} from '@nestjs/common';
import { StatsService } from './stats.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('stats')
export class StatsController {
  constructor(
    private readonly statsService: StatsService,
  ) { }

  @Get()
  getDashboardStats(@Req() req: any) {
    return this.statsService.getDashboardStats(
      req.user.id,
    );
  }

  @Get('portfolio')
  getPortfolio(@Req() req: any) {
    return this.statsService.getPortfolio(
      req.user.id,
    );
  }

  @Get('top-picks')
  getTopPicks(@Req() req: any) {
    return this.statsService.getTopPicks(req.user.id);
  }
}