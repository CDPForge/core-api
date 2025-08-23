import { Test, TestingModule } from '@nestjs/testing';
import { SegmentsController } from './segments.controller';
import { SegmentsService } from './segments.service';

const mockSegment = {
  id: 1,
  name: 'Test Segment',
  description: 'Test Description',
  query: { match_all: {} },
  status: 'active',
};

const mockSegmentsService = {
  create: jest.fn().mockResolvedValue(mockSegment),
  findAll: jest.fn().mockResolvedValue([mockSegment]),
  findOne: jest.fn().mockResolvedValue(mockSegment),
  update: jest.fn().mockResolvedValue([1]), // Sequelize update returns the number of affected rows
  remove: jest.fn().mockResolvedValue(1),
  findResults: jest.fn().mockResolvedValue({
    segment_id: 1,
    total: 1,
    ids: ['123'],
    scroll_id: 'scroll123',
  }),
};

describe('SegmentsController', () => {
  let controller: SegmentsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [SegmentsController],
      providers: [
        {
          provide: SegmentsService,
          useValue: mockSegmentsService,
        },
      ],
    }).compile();

    controller = module.get<SegmentsController>(SegmentsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should create a segment', async () => {
    const segment = await controller.create(mockSegment as any);
    expect(segment).toEqual(mockSegment);
  });

  it('should find all segments', async () => {
    const segments = await controller.findAll();
    expect(segments).toEqual([mockSegment]);
  });

  it('should find one segment', async () => {
    const segment = await controller.findOne('1');
    expect(segment).toEqual(mockSegment);
  });

  it('should update a segment', async () => {
    const result = await controller.update('1', { name: 'Updated' });
    expect(result).toEqual([1]);
  });

  it('should remove a segment', async () => {
    const result = await controller.remove('1');
    expect(result).toEqual(1);
  });

  it('should find results', async () => {
    const result = await controller.findResults('1', '10', undefined);
    expect(result.ids).toEqual(['123']);
  });
});
