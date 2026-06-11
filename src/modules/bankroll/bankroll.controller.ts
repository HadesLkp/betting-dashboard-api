import { Body, Controller, Get, Post } from '@nestjs/common';
import { BankrollService } from './bankroll.service';
import { CreateBankrollDto } from './dto/create-bankroll.dto';

@Controller('bankroll')
export class BankrollController {
  constructor(
    private readonly bankrollService: BankrollService,
  ) { }

  @Post()
  create(
    @Body() createBankrollDto: CreateBankrollDto,
  ) {
    return this.bankrollService.create(
      createBankrollDto,
    );
  }

  @Get()
  getCurrent() {
    return this.bankrollService.getCurrent();
  }

  @Get('history')
  getHistory() {
    return this.bankrollService.getHistory();
  }
}