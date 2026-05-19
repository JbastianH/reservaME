import { Test, TestingModule } from '@nestjs/testing';
import { ResenasPublicasController } from './resenas-publicas.controller';

describe('ResenasPublicasController', () => {
  let controller: ResenasPublicasController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ResenasPublicasController],
    }).compile();

    controller = module.get<ResenasPublicasController>(ResenasPublicasController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
