import { Body, Controller, Get, Post, Query, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PredictorService } from './predictor.service';
import { AnalyzePickDto } from './dto/analyze-pick.dto';
import { AnalyzeWithModelDto } from './dto/analyze-with-model.dto';
import { AnalyzeEventDto } from './dto/analyze-event.dto';

@UseGuards(JwtAuthGuard)
@Controller('predictor')
export class PredictorController {
  constructor(
    private readonly predictorService: PredictorService,
  ) { }

  @Post('analyze')
  analyzePick(
    @Body() dto: AnalyzePickDto,
  ) {
    return this.predictorService.analyzePick(dto);
  }

  @Get('match-probability')
  getMatchProbability(
    @Query('homeTeamId') homeTeamId: string,
    @Query('awayTeamId') awayTeamId: string,
  ) {
    return this.predictorService.getMatchProbability(
      Number(homeTeamId),
      Number(awayTeamId),
    );
  }


  @Post('analyze-with-model')
  analyzeWithModel(
    @Body() dto: AnalyzeWithModelDto,
    @Req() req: any,
  ) {
    return this.predictorService.analyzeWithModel(
      dto,
      req.user.id,
    );
  }

  @Post('analyze-event')
  analyzeEvent(
    @Body() dto: AnalyzeEventDto,
    @Req() req: any,
  ) {
    return this.predictorService.analyzeEvent(
      dto,
      req.user.id,
    );
  }

}