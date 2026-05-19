import { Test, TestingModule } from '@nestjs/testing';
import { ResenasPublicasService } from './resenas-publicas.service';

describe('ResenasPublicasService', () => {
  let service: ResenasPublicasService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ResenasPublicasService],
    }).compile();

    service = module.get<ResenasPublicasService>(ResenasPublicasService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
