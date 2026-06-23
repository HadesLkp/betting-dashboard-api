import {
  Body,
  Controller,
  Get,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { BankrollService } from './bankroll.service';
import { CreateBankrollDto } from './dto/create-bankroll.dto';

@UseGuards(JwtAuthGuard)
@Controller('bankroll')
export class BankrollController {
  constructor(
    private readonly bankrollService: BankrollService,
  ) { }

  @Post()
  create(
    @Body() createBankrollDto: CreateBankrollDto,
    @Req() req: any,
  ) {
    return this.bankrollService.create(
      createBankrollDto,
      req.user.id,
    );
  }

  @Get('current')
  getCurrent(@Req() req: any) {
    return this.bankrollService.getCurrent(
      req.user.id,
    );
  }

  @Get('history')
  getHistory(@Req() req: any) {
    return this.bankrollService.getHistory(
      req.user.id,
    );
  }
}