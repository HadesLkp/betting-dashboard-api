import { Test, TestingModule } from '@nestjs/testing';
import { BankrollController } from './bankroll.controller';

describe('BankrollController', () => {
  let controller: BankrollController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [BankrollController],
    }).compile();

    controller = module.get<BankrollController>(BankrollController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
