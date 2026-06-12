import { Body, Controller, Delete, Get, Param, Patch, Post, Put, Query } from '@nestjs/common';
import { UpdateBetResultDto } from './dto/update-bet-result.dto';
import { BetsService } from './bets.service';
import { UpdateBetDto } from './dto/update-bet.dto';
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
    @Query('market') market?: string,
    @Query('result') result?: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ): Promise<Bet[]> {
    return this.betsService.findAll({
      sport,
      market,
      result,
      from,
      to,
    });
  }

  @Put(':id')
  update(
    @Param('id') id: string,
    @Body() updateBetDto: UpdateBetDto,
  ): Promise<Bet> {
    return this.betsService.update(
      Number(id),
      updateBetDto,
    );
  }

  @Delete(':id')
  remove(@Param('id') id: string): Promise<{ message: string }> {
    return this.betsService.remove(Number(id));
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