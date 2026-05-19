import { Test, TestingModule } from '@nestjs/testing';
import { ResenasController } from './resenas.controller';

describe('ResenasController', () => {
  let controller: ResenasController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ResenasController],
    }).compile();

    controller = module.get<ResenasController>(ResenasController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
