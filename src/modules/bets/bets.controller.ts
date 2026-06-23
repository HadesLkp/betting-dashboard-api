import { Body, Controller, Delete, Get, Param, Patch, Post, Req, Put, Query } from '@nestjs/common';
import { UpdateBetResultDto } from './dto/update-bet-result.dto';
import { BetsService } from './bets.service';
import { UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { UpdateBetDto } from './dto/update-bet.dto';
import { CreateBetDto } from './dto/create-bet.dto';
import { Bet } from './entities/bet.entity';

@UseGuards(JwtAuthGuard)
@Controller('bets')
export class BetsController {
  constructor(private readonly betsService: BetsService) { }

  @Post()
  create(
    @Body() createBetDto: CreateBetDto,
    @Req() req: any,
  ): Promise<Bet> {
    return this.betsService.create(
      createBetDto,
      req.user,
    );
  }

  @Get()
  findAll(
    @Query() filters: any,
    @Req() req: any,
  ): Promise<Bet[]> {
    return this.betsService.findAll(filters, req.user.id);
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

  @Post('auto-settle')
  autoSettle() {
    return this.betsService.autoSettleMatchWinner();
  }

}