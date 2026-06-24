import { Test, TestingModule } from '@nestjs/testing';
import { FootballDataController } from './football-data.controller';

describe('FootballDataController', () => {
  let controller: FootballDataController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [FootballDataController],
    }).compile();

    controller = module.get<FootballDataController>(FootballDataController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
