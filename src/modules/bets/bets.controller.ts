import { Body, Controller, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { UpdateBetResultDto } from './dto/update-bet-result.dto';
import { BetsService } from './bets.service';
import { CreateBetDto } from './dto/create-bet.dto';
import { Bet } from './entities/bet.entity';

@Controller('bets')
export class BetsController {
  constructor(private readonly betsService: BetsService) { }

  @Post()
  create(@Body() createBetDto: CreateBetDto): Promise<Bet> {
    return this.betsService.create(createBetDto);
  }

  @Get()
  findAll(
    @Query('sport') sport?: string,
    @Query('result') result?: string,
  ): Promise<Bet[]> {
    return this.betsService.findAll({
      sport,
      result,
    });
  }

  @Patch(':id')
  updateResult(
    @Param('id') id: string,
    @Body() updateBetResultDto: UpdateBetResultDto,
  ): Promise<Bet> {
    return this.betsService.updateResult(
      Number(id),
      updateBetResultDto.result,
    );
  }
}