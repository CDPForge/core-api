import { Test, TestingModule } from "@nestjs/testing";
import { SegmentsService } from "./segments.service";
import { getModelToken } from "@nestjs/sequelize";
import { Segment } from "./entities/segment.entity";
import { OpensearchProvider } from "../opensearch/opensearch.provider";

const mockSegment = {
  id: 1,
  name: "Test Segment",
  description: "Test Description",
  query: { match_all: {} },
  status: "active",
};

const mockSegmentModel = {
  create: jest.fn().mockResolvedValue(mockSegment),
  findAll: jest.fn().mockResolvedValue([mockSegment]),
  findByPk: jest.fn().mockResolvedValue(mockSegment),
  update: jest.fn().mockResolvedValue([1]),
  destroy: jest.fn().mockResolvedValue(1),
};

const mockOpensearchProvider = {
  getClient: jest.fn().mockReturnValue({
    search: jest.fn().mockResolvedValue({
      body: {
        hits: {
          total: { value: 1 },
          hits: [{ _id: "123" }],
        },
        _scroll_id: "scroll123",
      },
    }),
    scroll: jest.fn().mockResolvedValue({
      body: {
        hits: {
          total: { value: 1 },
          hits: [{ _id: "456" }],
        },
        _scroll_id: "scroll456",
      },
    }),
  }),
};

describe("SegmentsService", () => {
  let service: SegmentsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SegmentsService,
        {
          provide: getModelToken(Segment),
          useValue: mockSegmentModel,
        },
        {
          provide: OpensearchProvider,
          useValue: mockOpensearchProvider,
        },
      ],
    }).compile();

    service = module.get<SegmentsService>(SegmentsService);
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  it("should create a segment", async () => {
    const segment = await service.create(mockSegment);
    expect(segment).toEqual(mockSegment);
  });

  it("should find all segments", async () => {
    const segments = await service.findAll();
    expect(segments).toEqual([mockSegment]);
  });

  it("should find one segment", async () => {
    const segment = await service.findOne(1);
    expect(segment).toEqual(mockSegment);
  });

  it("should update a segment", async () => {
    const result = await service.update(1, { name: "Updated" });
    expect(result).toEqual([1]);
  });

  it("should remove a segment", async () => {
    const result = await service.remove(1);
    expect(result).toEqual(1);
  });

  it("should find results from opensearch", async () => {
    const result = await service.findResults(1, 10);
    expect(result.ids).toEqual(["123"]);
  });
});
