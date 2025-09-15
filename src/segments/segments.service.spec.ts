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
    count: jest.fn().mockResolvedValue({
      body: {
        count: 1500,
      },
    }),
    indices: {
      getAlias: jest.fn().mockResolvedValue({
        body: {
          "users-logs-1-000001": {
            aliases: {
              "users-logs-1": {
                is_write_index: true,
              },
            },
          },
        },
      }),
      getMapping: jest.fn().mockResolvedValue({
        body: {
          "users-logs-1-000001": {
            mappings: {
              properties: {
                "device.id": { type: "keyword" },
                "user.id": { type: "keyword" },
              },
            },
          },
        },
      }),
    },
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

  describe("buildQueryWithInstanceFilter", () => {
    it("should return original query when no instance filter", () => {
      const baseQuery = { match_all: {} };
      const result = (service as any).buildQueryWithInstanceFilter(baseQuery);
      expect(result).toEqual({ match_all: {} });
    });

    it("should add instance filter to simple query", () => {
      const baseQuery = { match_all: {} };
      const result = (service as any).buildQueryWithInstanceFilter(
        baseQuery,
        2,
      );
      expect(result).toEqual({
        bool: {
          must: [{ match_all: {} }, { term: { "instance.id": 2 } }],
        },
      });
    });

    it("should add instance filter to existing bool query", () => {
      const baseQuery = {
        bool: {
          must: [{ term: { "user.active": true } }],
        },
      };
      const result = (service as any).buildQueryWithInstanceFilter(
        baseQuery,
        3,
      );
      expect(result).toEqual({
        bool: {
          must: [
            { term: { "user.active": true } },
            { term: { "instance.id": 3 } },
          ],
        },
      });
    });

    it("should handle bool query without must clause", () => {
      const baseQuery = {
        bool: {
          should: [{ term: { "user.type": "premium" } }],
        },
      };
      const result = (service as any).buildQueryWithInstanceFilter(
        baseQuery,
        4,
      );
      expect(result).toEqual({
        bool: {
          should: [{ term: { "user.type": "premium" } }],
          must: [{ term: { "instance.id": 4 } }],
        },
      });
    });

    it("should handle bool query with existing must array", () => {
      const baseQuery = {
        bool: {
          must: [
            { term: { "user.active": true } },
            { range: { "user.age": { gte: 18 } } },
          ],
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
            { range: { "user.age": { gte: 18 } } },
            { term: { "instance.id": 5 } },
          ],
        },
      });
    });

    it("should handle bool query with filter clause", () => {
      const baseQuery = {
        bool: {
          filter: [{ term: { status: "active" } }],
        },
      };
      const result = (service as any).buildQueryWithInstanceFilter(
        baseQuery,
        6,
      );
      expect(result).toEqual({
        bool: {
          filter: [{ term: { status: "active" } }],
          must: [{ term: { "instance.id": 6 } }],
        },
      });
    });

    it("should handle bool query with must_not clause", () => {
      const baseQuery = {
        bool: {
          must_not: [{ term: { "user.deleted": true } }],
        },
      };
      const result = (service as any).buildQueryWithInstanceFilter(
        baseQuery,
        7,
      );
      expect(result).toEqual({
        bool: {
          must_not: [{ term: { "user.deleted": true } }],
          must: [{ term: { "instance.id": 7 } }],
        },
      });
    });

    it("should handle complex nested bool query", () => {
      const baseQuery = {
        bool: {
          must: [
            {
              bool: {
                should: [
                  { term: { "user.type": "premium" } },
                  { term: { "user.type": "enterprise" } },
                ],
              },
            },
          ],
          filter: [{ range: { "user.created_at": { gte: "2023-01-01" } } }],
        },
      };
      const result = (service as any).buildQueryWithInstanceFilter(
        baseQuery,
        8,
      );
      expect(result).toEqual({
        bool: {
          must: [
            {
              bool: {
                should: [
                  { term: { "user.type": "premium" } },
                  { term: { "user.type": "enterprise" } },
                ],
              },
            },
            { term: { "instance.id": 8 } },
          ],
          filter: [{ range: { "user.created_at": { gte: "2023-01-01" } } }],
        },
      });
    });

    it("should handle term query", () => {
      const baseQuery = { term: { "user.status": "active" } };
      const result = (service as any).buildQueryWithInstanceFilter(
        baseQuery,
        9,
      );
      expect(result).toEqual({
        bool: {
          must: [
            { term: { "user.status": "active" } },
            { term: { "instance.id": 9 } },
          ],
        },
      });
    });

    it("should handle range query", () => {
      const baseQuery = { range: { "user.age": { gte: 18, lte: 65 } } };
      const result = (service as any).buildQueryWithInstanceFilter(
        baseQuery,
        10,
      );
      expect(result).toEqual({
        bool: {
          must: [
            { range: { "user.age": { gte: 18, lte: 65 } } },
            { term: { "instance.id": 10 } },
          ],
        },
      });
    });

    it("should handle wildcard query", () => {
      const baseQuery = { wildcard: { "user.name": "john*" } };
      const result = (service as any).buildQueryWithInstanceFilter(
        baseQuery,
        11,
      );
      expect(result).toEqual({
        bool: {
          must: [
            { wildcard: { "user.name": "john*" } },
            { term: { "instance.id": 11 } },
          ],
        },
      });
    });

    it("should handle empty query object", () => {
      const baseQuery = {};
      const result = (service as any).buildQueryWithInstanceFilter(
        baseQuery,
        12,
      );
      expect(result).toEqual({
        bool: {
          must: [{}, { term: { "instance.id": 12 } }],
        },
      });
    });

    it("should handle null instanceId", () => {
      const baseQuery = { match_all: {} };
      const result = (service as any).buildQueryWithInstanceFilter(
        baseQuery,
        null,
      );
      expect(result).toEqual({ match_all: {} });
    });

    it("should handle undefined instanceId", () => {
      const baseQuery = { match_all: {} };
      const result = (service as any).buildQueryWithInstanceFilter(
        baseQuery,
        undefined,
      );
      expect(result).toEqual({ match_all: {} });
    });

    it("should handle zero instanceId", () => {
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

    it("should handle negative instanceId", () => {
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

    it("should preserve original query object immutability", () => {
      const baseQuery = {
        bool: {
          must: [{ term: { "user.active": true } }],
        },
      };
      const originalQuery = JSON.parse(JSON.stringify(baseQuery));

      (service as any).buildQueryWithInstanceFilter(baseQuery, 13);

      expect(baseQuery).toEqual(originalQuery);
    });
  });

  describe("preview", () => {
    it("should preview segment without instance filter", async () => {
      const previewDto = {
        clientId: 1,
        query: { match_all: {} },
      };

      const result = await service.preview(previewDto);

      expect(result.estimatedCount).toBe(1500);
      expect(result.executionTime).toBeGreaterThanOrEqual(0);
      expect(result.hasMore).toBe(false);

      const mockClient = mockOpensearchProvider.getClient();
      expect(mockClient.count).toHaveBeenCalledWith({
        index: "users-logs-1",
        body: {
          query: { match_all: {} },
        },
      });
    });

    it("should preview segment with instance filter", async () => {
      const previewDto = {
        clientId: 1,
        instanceId: 2,
        query: { match_all: {} },
      };

      const result = await service.preview(previewDto);

      expect(result.estimatedCount).toBe(1500);
      expect(result.executionTime).toBeGreaterThanOrEqual(0);
      expect(result.hasMore).toBe(false);

      const mockClient = mockOpensearchProvider.getClient();
      expect(mockClient.count).toHaveBeenCalledWith({
        index: "users-logs-1",
        body: {
          query: {
            bool: {
              must: [{ match_all: {} }, { term: { "instance.id": 2 } }],
            },
          },
        },
      });
    });

    it("should preview segment with complex query and instance filter", async () => {
      const previewDto = {
        clientId: 1,
        instanceId: 3,
        query: {
          bool: {
            must: [{ term: { "user.active": true } }],
          },
        },
      };

      const result = await service.preview(previewDto);

      expect(result.estimatedCount).toBe(1500);

      const mockClient = mockOpensearchProvider.getClient();
      expect(mockClient.count).toHaveBeenCalledWith({
        index: "users-logs-1",
        body: {
          query: {
            bool: {
              must: [
                { term: { "user.active": true } },
                { term: { "instance.id": 3 } },
              ],
            },
          },
        },
      });
    });

    it("should handle preview errors gracefully", async () => {
      const mockClient = mockOpensearchProvider.getClient();
      mockClient.count.mockRejectedValueOnce(new Error("OpenSearch error"));

      const previewDto = {
        clientId: 1,
        query: { match_all: {} },
      };

      await expect(service.preview(previewDto)).rejects.toThrow(
        "Preview calculation failed: OpenSearch error",
      );
    });

    it("should indicate hasMore for large result sets", async () => {
      const mockClient = mockOpensearchProvider.getClient();
      mockClient.count.mockResolvedValueOnce({
        body: { count: 15000 },
      });

      const previewDto = {
        clientId: 1,
        query: { match_all: {} },
      };

      const result = await service.preview(previewDto);

      expect(result.estimatedCount).toBe(15000);
      expect(result.hasMore).toBe(true);
    });

    it("should handle zero count results", async () => {
      const mockClient = mockOpensearchProvider.getClient();
      mockClient.count.mockResolvedValueOnce({
        body: { count: 0 },
      });

      const previewDto = {
        clientId: 1,
        query: { term: { "nonexistent.field": "value" } },
      };

      const result = await service.preview(previewDto);

      expect(result.estimatedCount).toBe(0);
      expect(result.hasMore).toBe(false);
    });

    it("should handle OpenSearch connection errors", async () => {
      const mockClient = mockOpensearchProvider.getClient();
      const connectionError = new Error("Connection refused");
      connectionError.name = "ConnectionError";
      mockClient.count.mockRejectedValueOnce(connectionError);

      const previewDto = {
        clientId: 1,
        query: { match_all: {} },
      };

      await expect(service.preview(previewDto)).rejects.toThrow(
        "Preview calculation failed: Connection refused",
      );
    });

    it("should handle OpenSearch timeout errors", async () => {
      const mockClient = mockOpensearchProvider.getClient();
      const timeoutError = new Error("Request timeout");
      timeoutError.name = "TimeoutError";
      mockClient.count.mockRejectedValueOnce(timeoutError);

      const previewDto = {
        clientId: 1,
        query: { match_all: {} },
      };

      await expect(service.preview(previewDto)).rejects.toThrow(
        "Preview calculation failed: Request timeout",
      );
    });

    it("should handle malformed query errors", async () => {
      const mockClient = mockOpensearchProvider.getClient();
      const queryError = new Error("Parsing exception");
      queryError.name = "ResponseError";
      mockClient.count.mockRejectedValueOnce(queryError);

      const previewDto = {
        clientId: 1,
        query: { invalid_syntax: { malformed: true } },
      };

      await expect(service.preview(previewDto)).rejects.toThrow(
        "Preview calculation failed: Parsing exception",
      );
    });

    it("should measure execution time accurately", async () => {
      const mockClient = mockOpensearchProvider.getClient();

      // Mock a delay in the count operation
      mockClient.count.mockImplementationOnce(
        () =>
          new Promise((resolve) =>
            setTimeout(() => resolve({ body: { count: 1000 } }), 100),
          ),
      );

      const previewDto = {
        clientId: 1,
        query: { match_all: {} },
      };

      const result = await service.preview(previewDto);

      expect(result.executionTime).toBeGreaterThanOrEqual(90); // Allow some variance
      expect(result.executionTime).toBeLessThan(200);
    });

    it("should handle very large count values", async () => {
      const mockClient = mockOpensearchProvider.getClient();
      mockClient.count.mockResolvedValueOnce({
        body: { count: 999999999 },
      });

      const previewDto = {
        clientId: 1,
        query: { match_all: {} },
      };

      const result = await service.preview(previewDto);

      expect(result.estimatedCount).toBe(999999999);
      expect(result.hasMore).toBe(true);
    });

    it("should handle instance filter with zero instanceId", async () => {
      const previewDto = {
        clientId: 1,
        instanceId: 0,
        query: { match_all: {} },
      };

      const result = await service.preview(previewDto);

      const mockClient = mockOpensearchProvider.getClient();
      expect(mockClient.count).toHaveBeenCalledWith({
        index: "users-logs-1",
        body: {
          query: {
            bool: {
              must: [{ match_all: {} }, { term: { "instance.id": 0 } }],
            },
          },
        },
      });
    });

    it("should handle negative client IDs gracefully", async () => {
      const previewDto = {
        clientId: -1,
        query: { match_all: {} },
      };

      const result = await service.preview(previewDto);

      const mockClient = mockOpensearchProvider.getClient();
      expect(mockClient.count).toHaveBeenCalledWith({
        index: "users-logs--1",
        body: {
          query: { match_all: {} },
        },
      });
    });

    it("should handle concurrent preview requests", async () => {
      const mockClient = mockOpensearchProvider.getClient();
      mockClient.count.mockResolvedValue({
        body: { count: 500 },
      });

      const previewDto = {
        clientId: 1,
        query: { match_all: {} },
      };

      // Simulate concurrent requests
      const promises = Array.from({ length: 5 }, () =>
        service.preview(previewDto),
      );
      const results = await Promise.all(promises);

      results.forEach((result) => {
        expect(result.estimatedCount).toBe(500);
        expect(result.hasMore).toBe(false);
      });

      expect(mockClient.count).toHaveBeenCalledTimes(5);
    });

    it("should handle empty response body", async () => {
      const mockClient = mockOpensearchProvider.getClient();
      mockClient.count.mockResolvedValueOnce({
        body: {},
      });

      const previewDto = {
        clientId: 1,
        query: { match_all: {} },
      };

      const result = await service.preview(previewDto);

      expect(result.estimatedCount).toBe(0);
      expect(result.hasMore).toBe(false);
    });

    it("should handle null count in response", async () => {
      const mockClient = mockOpensearchProvider.getClient();
      mockClient.count.mockResolvedValueOnce({
        body: { count: null },
      });

      const previewDto = {
        clientId: 1,
        query: { match_all: {} },
      };

      const result = await service.preview(previewDto);

      expect(result.estimatedCount).toBe(0);
      expect(result.hasMore).toBe(false);
    });
  });
});
