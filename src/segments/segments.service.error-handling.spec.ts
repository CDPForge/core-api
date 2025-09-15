import { Test, TestingModule } from "@nestjs/testing";
import { SegmentsService } from "./segments.service";
import { getModelToken } from "@nestjs/sequelize";
import { Segment } from "./entities/segment.entity";
import { OpensearchProvider } from "../opensearch/opensearch.provider";
import { PreviewSegmentDto } from "./dto/preview-segment.dto";

const mockSegmentModel = {
  create: jest.fn(),
  findAll: jest.fn(),
  findByPk: jest.fn(),
  update: jest.fn(),
  destroy: jest.fn(),
};

const mockOpensearchProvider = {
  getClient: jest.fn(),
};

describe("SegmentsService - Error Handling and Edge Cases", () => {
  let service: SegmentsService;
  let mockOsClient: any;

  beforeEach(async () => {
    mockOsClient = {
      search: jest.fn(),
      scroll: jest.fn(),
      count: jest.fn(),
      indices: {
        getAlias: jest.fn(),
        getMapping: jest.fn(),
      },
    };

    mockOpensearchProvider.getClient.mockReturnValue(mockOsClient);

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

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("preview - Error Handling", () => {
    it("should handle OpenSearch connection timeout", async () => {
      const previewDto: PreviewSegmentDto = {
        clientId: 1,
        query: { match_all: {} },
      };

      const timeoutError = new Error("Request timeout");
      timeoutError.name = "TimeoutError";
      mockOsClient.count.mockRejectedValue(timeoutError);

      await expect(service.preview(previewDto)).rejects.toThrow(
        "Preview calculation failed: Request timeout",
      );
    });

    it("should handle OpenSearch index not found error", async () => {
      const previewDto: PreviewSegmentDto = {
        clientId: 999,
        query: { match_all: {} },
      };

      const indexError = new Error("index_not_found_exception");
      mockOsClient.count.mockRejectedValue(indexError);

      await expect(service.preview(previewDto)).rejects.toThrow(
        "Preview calculation failed: index_not_found_exception",
      );
    });

    it("should handle malformed query errors", async () => {
      const previewDto: PreviewSegmentDto = {
        clientId: 1,
        query: { invalid_query: { malformed: true } },
      };

      const queryError = new Error("parsing_exception");
      mockOsClient.count.mockRejectedValue(queryError);

      await expect(service.preview(previewDto)).rejects.toThrow(
        "Preview calculation failed: parsing_exception",
      );
    });

    it("should handle OpenSearch cluster unavailable", async () => {
      const previewDto: PreviewSegmentDto = {
        clientId: 1,
        query: { match_all: {} },
      };

      const clusterError = new Error("No living connections");
      mockOsClient.count.mockRejectedValue(clusterError);

      await expect(service.preview(previewDto)).rejects.toThrow(
        "Preview calculation failed: No living connections",
      );
    });

    it("should handle permission denied errors", async () => {
      const previewDto: PreviewSegmentDto = {
        clientId: 1,
        query: { match_all: {} },
      };

      const permissionError = new Error("security_exception");
      mockOsClient.count.mockRejectedValue(permissionError);

      await expect(service.preview(previewDto)).rejects.toThrow(
        "Preview calculation failed: security_exception",
      );
    });

    it("should handle empty response from OpenSearch", async () => {
      const previewDto: PreviewSegmentDto = {
        clientId: 1,
        query: { match_all: {} },
      };

      mockOsClient.count.mockResolvedValue({
        body: {}, // Empty body
      });

      const result = await service.preview(previewDto);

      expect(result.estimatedCount).toBe(0);
      expect(result.executionTime).toBeGreaterThanOrEqual(0);
      expect(result.hasMore).toBe(false);
    });

    it("should handle null response from OpenSearch", async () => {
      const previewDto: PreviewSegmentDto = {
        clientId: 1,
        query: { match_all: {} },
      };

      mockOsClient.count.mockResolvedValue({
        body: {
          count: null,
        },
      });

      const result = await service.preview(previewDto);

      expect(result.estimatedCount).toBe(0);
    });

    it("should handle undefined response from OpenSearch", async () => {
      const previewDto: PreviewSegmentDto = {
        clientId: 1,
        query: { match_all: {} },
      };

      mockOsClient.count.mockResolvedValue({
        body: {
          count: undefined,
        },
      });

      const result = await service.preview(previewDto);

      expect(result.estimatedCount).toBe(0);
    });
  });

  describe("preview - Edge Cases", () => {
    it("should handle very large count values", async () => {
      const previewDto: PreviewSegmentDto = {
        clientId: 1,
        query: { match_all: {} },
      };

      mockOsClient.count.mockResolvedValue({
        body: {
          count: Number.MAX_SAFE_INTEGER,
        },
      });

      const result = await service.preview(previewDto);

      expect(result.estimatedCount).toBe(Number.MAX_SAFE_INTEGER);
      expect(result.hasMore).toBe(true);
    });

    it("should handle negative count values gracefully", async () => {
      const previewDto: PreviewSegmentDto = {
        clientId: 1,
        query: { match_all: {} },
      };

      mockOsClient.count.mockResolvedValue({
        body: {
          count: -1,
        },
      });

      const result = await service.preview(previewDto);

      expect(result.estimatedCount).toBe(-1);
      expect(result.hasMore).toBe(false);
    });

    it("should handle zero count correctly", async () => {
      const previewDto: PreviewSegmentDto = {
        clientId: 1,
        query: { term: { "nonexistent.field": "value" } },
      };

      mockOsClient.count.mockResolvedValue({
        body: {
          count: 0,
        },
      });

      const result = await service.preview(previewDto);

      expect(result.estimatedCount).toBe(0);
      expect(result.hasMore).toBe(false);
    });

    it("should handle exactly 10000 count (boundary case)", async () => {
      const previewDto: PreviewSegmentDto = {
        clientId: 1,
        query: { match_all: {} },
      };

      mockOsClient.count.mockResolvedValue({
        body: {
          count: 10000,
        },
      });

      const result = await service.preview(previewDto);

      expect(result.estimatedCount).toBe(10000);
      expect(result.hasMore).toBe(false); // Exactly 10000 should not indicate "more"
    });

    it("should handle 10001 count (just over boundary)", async () => {
      const previewDto: PreviewSegmentDto = {
        clientId: 1,
        query: { match_all: {} },
      };

      mockOsClient.count.mockResolvedValue({
        body: {
          count: 10001,
        },
      });

      const result = await service.preview(previewDto);

      expect(result.estimatedCount).toBe(10001);
      expect(result.hasMore).toBe(true);
    });

    it("should measure execution time accurately", async () => {
      const previewDto: PreviewSegmentDto = {
        clientId: 1,
        query: { match_all: {} },
      };

      // Mock a delay in the OpenSearch response
      mockOsClient.count.mockImplementation(
        () =>
          new Promise((resolve) =>
            setTimeout(() => resolve({ body: { count: 100 } }), 100),
          ),
      );

      const result = await service.preview(previewDto);

      expect(result.executionTime).toBeGreaterThanOrEqual(100);
      expect(result.executionTime).toBeLessThan(200); // Should be reasonable
    });
  });

  describe("buildQueryWithInstanceFilter - Edge Cases", () => {
    it("should handle null base query", () => {
      const result = (service as any).buildQueryWithInstanceFilter(null, 1);

      expect(result).toEqual({
        bool: {
          must: [null, { term: { "instance.id": 1 } }],
        },
      });
    });

    it("should handle undefined base query", () => {
      const result = (service as any).buildQueryWithInstanceFilter(
        undefined,
        1,
      );

      expect(result).toEqual({
        bool: {
          must: [undefined, { term: { "instance.id": 1 } }],
        },
      });
    });

    it("should handle empty object base query", () => {
      const result = (service as any).buildQueryWithInstanceFilter({}, 1);

      expect(result).toEqual({
        bool: {
          must: [{}, { term: { "instance.id": 1 } }],
        },
      });
    });

    it("should handle zero instance ID", () => {
      const baseQuery = { match_all: {} };
      const result = (service as any).buildQueryWithInstanceFilter(
        baseQuery,
        0,
      );

      expect(result).toEqual({
        bool: {
          must: [{ match_all: {} }, { term: { "instance.id": 0 } }],
        },
      });
    });

    it("should handle negative instance ID", () => {
      const baseQuery = { match_all: {} };
      const result = (service as any).buildQueryWithInstanceFilter(
        baseQuery,
        -1,
      );

      expect(result).toEqual({
        bool: {
          must: [{ match_all: {} }, { term: { "instance.id": -1 } }],
        },
      });
    });

    it("should handle very large instance ID", () => {
      const baseQuery = { match_all: {} };
      const result = (service as any).buildQueryWithInstanceFilter(
        baseQuery,
        Number.MAX_SAFE_INTEGER,
      );

      expect(result).toEqual({
        bool: {
          must: [
            { match_all: {} },
            { term: { "instance.id": Number.MAX_SAFE_INTEGER } },
          ],
        },
      });
    });

    it("should handle bool query with multiple clauses", () => {
      const baseQuery = {
        bool: {
          must: [{ term: { "user.active": true } }],
          should: [{ term: { "user.type": "premium" } }],
          must_not: [{ term: { "user.banned": true } }],
          filter: [{ range: { "user.age": { gte: 18 } } }],
        },
      };

      const result = (service as any).buildQueryWithInstanceFilter(
        baseQuery,
        5,
      );

      expect(result).toEqual({
        bool: {
          must: [
            { term: { "user.active": true } },
            { term: { "instance.id": 5 } },
          ],
          should: [{ term: { "user.type": "premium" } }],
          must_not: [{ term: { "user.banned": true } }],
          filter: [{ range: { "user.age": { gte: 18 } } }],
        },
      });
    });

    it("should handle deeply nested bool queries", () => {
      const baseQuery = {
        bool: {
          must: [
            {
              bool: {
                should: [
                  { term: { category: "A" } },
                  { term: { category: "B" } },
                ],
              },
            },
          ],
        },
      };

      const result = (service as any).buildQueryWithInstanceFilter(
        baseQuery,
        3,
      );

      expect(result).toEqual({
        bool: {
          must: [
            {
              bool: {
                should: [
                  { term: { category: "A" } },
                  { term: { category: "B" } },
                ],
              },
            },
            { term: { "instance.id": 3 } },
          ],
        },
      });
    });
  });

  describe("preview - Instance Filtering Integration", () => {
    it("should correctly apply instance filter to complex queries", async () => {
      const previewDto: PreviewSegmentDto = {
        clientId: 1,
        instanceId: 2,
        query: {
          bool: {
            must: [
              { term: { "user.active": true } },
              { range: { timestamp: { gte: "2023-01-01" } } },
            ],
            should: [{ term: { "user.type": "premium" } }],
          },
        },
      };

      mockOsClient.count.mockResolvedValue({
        body: { count: 500 },
      });

      const result = await service.preview(previewDto);

      expect(mockOsClient.count).toHaveBeenCalledWith({
        index: "users-logs-1",
        body: {
          query: {
            bool: {
              must: [
                { term: { "user.active": true } },
                { range: { timestamp: { gte: "2023-01-01" } } },
                { term: { "instance.id": 2 } },
              ],
              should: [{ term: { "user.type": "premium" } }],
            },
          },
        },
      });

      expect(result.estimatedCount).toBe(500);
    });

    it("should handle preview without instance filter", async () => {
      const previewDto: PreviewSegmentDto = {
        clientId: 1,
        query: { match_all: {} },
      };

      mockOsClient.count.mockResolvedValue({
        body: { count: 1000 },
      });

      const result = await service.preview(previewDto);

      expect(mockOsClient.count).toHaveBeenCalledWith({
        index: "users-logs-1",
        body: {
          query: { match_all: {} },
        },
      });

      expect(result.estimatedCount).toBe(1000);
    });
  });
});
