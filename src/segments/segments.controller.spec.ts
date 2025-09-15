import { Test, TestingModule } from "@nestjs/testing";
import { SegmentsController } from "./segments.controller";
import { SegmentsService } from "./segments.service";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { PermissionsGuard } from "../auth/permission.guard";
import { PreviewSegmentDto } from "./dto/preview-segment.dto";
import { CreateSegmentDto } from "./dto/create-segment.dto";
import { UpdateSegmentDto } from "./dto/update-segment.dto";

const mockSegmentsService = {
  create: jest.fn(),
  preview: jest.fn(),
  findAll: jest.fn(),
  findOne: jest.fn(),
  update: jest.fn(),
  remove: jest.fn(),
  findResults: jest.fn(),
  getMapping: jest.fn(),
};

const mockJwtAuthGuard = {
  canActivate: jest.fn().mockReturnValue(true),
};

const mockPermissionsGuard = {
  canActivate: jest.fn().mockReturnValue(true),
};

describe("SegmentsController", () => {
  let controller: SegmentsController;
  let service: SegmentsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [SegmentsController],
      providers: [
        {
          provide: SegmentsService,
          useValue: mockSegmentsService,
        },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue(mockJwtAuthGuard)
      .overrideGuard(PermissionsGuard)
      .useValue(mockPermissionsGuard)
      .compile();

    controller = module.get<SegmentsController>(SegmentsController);
    service = module.get<SegmentsService>(SegmentsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should be defined", () => {
    expect(controller).toBeDefined();
  });

  describe("preview", () => {
    it("should preview segment without instance filter", async () => {
      const previewDto: PreviewSegmentDto = {
        clientId: 1,
        query: { match_all: {} },
      };

      const expectedResult = {
        estimatedCount: 1500,
        executionTime: 125,
        hasMore: false,
      };

      mockSegmentsService.preview.mockResolvedValue(expectedResult);

      const result = await controller.preview(previewDto);

      expect(result).toEqual(expectedResult);
      expect(service.preview).toHaveBeenCalledWith(previewDto);
      expect(service.preview).toHaveBeenCalledTimes(1);
    });

    it("should preview segment with instance filter", async () => {
      const previewDto: PreviewSegmentDto = {
        clientId: 1,
        instanceId: 2,
        query: { match_all: {} },
      };

      const expectedResult = {
        estimatedCount: 750,
        executionTime: 89,
        hasMore: false,
      };

      mockSegmentsService.preview.mockResolvedValue(expectedResult);

      const result = await controller.preview(previewDto);

      expect(result).toEqual(expectedResult);
      expect(service.preview).toHaveBeenCalledWith(previewDto);
    });

    it("should preview segment with complex query", async () => {
      const previewDto: PreviewSegmentDto = {
        clientId: 1,
        instanceId: 3,
        query: {
          bool: {
            must: [
              { term: { "user.active": true } },
              { range: { "user.age": { gte: 18 } } },
            ],
          },
        },
      };

      const expectedResult = {
        estimatedCount: 2500,
        executionTime: 200,
        hasMore: true,
      };

      mockSegmentsService.preview.mockResolvedValue(expectedResult);

      const result = await controller.preview(previewDto);

      expect(result).toEqual(expectedResult);
      expect(service.preview).toHaveBeenCalledWith(previewDto);
    });

    it("should handle preview with zero results", async () => {
      const previewDto: PreviewSegmentDto = {
        clientId: 1,
        query: { term: { "nonexistent.field": "value" } },
      };

      const expectedResult = {
        estimatedCount: 0,
        executionTime: 45,
        hasMore: false,
      };

      mockSegmentsService.preview.mockResolvedValue(expectedResult);

      const result = await controller.preview(previewDto);

      expect(result).toEqual(expectedResult);
      expect(result.estimatedCount).toBe(0);
    });

    it("should handle preview with large result sets", async () => {
      const previewDto: PreviewSegmentDto = {
        clientId: 1,
        query: { match_all: {} },
      };

      const expectedResult = {
        estimatedCount: 50000,
        executionTime: 500,
        hasMore: true,
      };

      mockSegmentsService.preview.mockResolvedValue(expectedResult);

      const result = await controller.preview(previewDto);

      expect(result).toEqual(expectedResult);
      expect(result.hasMore).toBe(true);
    });

    it("should propagate service errors", async () => {
      const previewDto: PreviewSegmentDto = {
        clientId: 1,
        query: { match_all: {} },
      };

      const serviceError = new Error("OpenSearch connection failed");
      mockSegmentsService.preview.mockRejectedValue(serviceError);

      await expect(controller.preview(previewDto)).rejects.toThrow(
        "OpenSearch connection failed",
      );
    });

    it("should handle invalid client ID", async () => {
      const previewDto: PreviewSegmentDto = {
        clientId: 999,
        query: { match_all: {} },
      };

      const serviceError = new Error("Client not found");
      mockSegmentsService.preview.mockRejectedValue(serviceError);

      await expect(controller.preview(previewDto)).rejects.toThrow(
        "Client not found",
      );
    });

    it("should handle invalid instance ID", async () => {
      const previewDto: PreviewSegmentDto = {
        clientId: 1,
        instanceId: 999,
        query: { match_all: {} },
      };

      const serviceError = new Error("Instance not found");
      mockSegmentsService.preview.mockRejectedValue(serviceError);

      await expect(controller.preview(previewDto)).rejects.toThrow(
        "Instance not found",
      );
    });

    it("should handle malformed queries", async () => {
      const previewDto: PreviewSegmentDto = {
        clientId: 1,
        query: { invalid_query_structure: true },
      };

      const serviceError = new Error("Invalid query structure");
      mockSegmentsService.preview.mockRejectedValue(serviceError);

      await expect(controller.preview(previewDto)).rejects.toThrow(
        "Invalid query structure",
      );
    });

    it("should handle preview timeout errors", async () => {
      const previewDto: PreviewSegmentDto = {
        clientId: 1,
        query: { match_all: {} },
      };

      const timeoutError = new Error("Request timeout");
      timeoutError.name = "TimeoutError";
      mockSegmentsService.preview.mockRejectedValue(timeoutError);

      await expect(controller.preview(previewDto)).rejects.toThrow(
        "Request timeout",
      );
    });

    it("should handle OpenSearch cluster errors", async () => {
      const previewDto: PreviewSegmentDto = {
        clientId: 1,
        query: { match_all: {} },
      };

      const clusterError = new Error("Cluster unavailable");
      clusterError.name = "ConnectionError";
      mockSegmentsService.preview.mockRejectedValue(clusterError);

      await expect(controller.preview(previewDto)).rejects.toThrow(
        "Cluster unavailable",
      );
    });

    it("should handle empty query objects", async () => {
      const previewDto: PreviewSegmentDto = {
        clientId: 1,
        query: {},
      };

      const expectedResult = {
        estimatedCount: 0,
        executionTime: 10,
        hasMore: false,
      };

      mockSegmentsService.preview.mockResolvedValue(expectedResult);

      const result = await controller.preview(previewDto);

      expect(result).toEqual(expectedResult);
    });

    it("should handle nested bool queries with instance filter", async () => {
      const previewDto: PreviewSegmentDto = {
        clientId: 1,
        instanceId: 2,
        query: {
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
        },
      };

      const expectedResult = {
        estimatedCount: 1200,
        executionTime: 150,
        hasMore: false,
      };

      mockSegmentsService.preview.mockResolvedValue(expectedResult);

      const result = await controller.preview(previewDto);

      expect(result).toEqual(expectedResult);
      expect(service.preview).toHaveBeenCalledWith(previewDto);
    });

    it("should handle concurrent preview requests", async () => {
      const previewDto: PreviewSegmentDto = {
        clientId: 1,
        query: { match_all: {} },
      };

      const expectedResult = {
        estimatedCount: 1000,
        executionTime: 100,
        hasMore: false,
      };

      mockSegmentsService.preview.mockResolvedValue(expectedResult);

      // Simulate concurrent requests
      const promises = Array.from({ length: 3 }, () =>
        controller.preview(previewDto),
      );
      const results = await Promise.all(promises);

      results.forEach((result) => {
        expect(result).toEqual(expectedResult);
      });

      expect(service.preview).toHaveBeenCalledTimes(3);
    });

    it("should validate preview response structure", async () => {
      const previewDto: PreviewSegmentDto = {
        clientId: 1,
        query: { match_all: {} },
      };

      const expectedResult = {
        estimatedCount: 500,
        executionTime: 75,
        hasMore: false,
      };

      mockSegmentsService.preview.mockResolvedValue(expectedResult);

      const result = await controller.preview(previewDto);

      expect(result).toHaveProperty("estimatedCount");
      expect(result).toHaveProperty("executionTime");
      expect(result).toHaveProperty("hasMore");
      expect(typeof result.estimatedCount).toBe("number");
      expect(typeof result.executionTime).toBe("number");
      expect(typeof result.hasMore).toBe("boolean");
    });

    it("should handle instance filter with zero instanceId", async () => {
      const previewDto: PreviewSegmentDto = {
        clientId: 1,
        instanceId: 0,
        query: { match_all: {} },
      };

      const expectedResult = {
        estimatedCount: 0,
        executionTime: 25,
        hasMore: false,
      };

      mockSegmentsService.preview.mockResolvedValue(expectedResult);

      const result = await controller.preview(previewDto);

      expect(result).toEqual(expectedResult);
      expect(service.preview).toHaveBeenCalledWith(previewDto);
    });
  });

  describe("create", () => {
    it("should create segment without instance", async () => {
      const createDto: CreateSegmentDto = {
        name: "Test Segment",
        description: "Test Description",
        client: 1,
        query: { match_all: {} },
        status: "active",
      };

      const createdSegment = { id: 1, ...createDto };
      mockSegmentsService.create.mockResolvedValue(createdSegment);

      const result = await controller.create(createDto);

      expect(result).toEqual(createdSegment);
      expect(service.create).toHaveBeenCalledWith(createDto);
    });

    it("should create segment with instance", async () => {
      const createDto: CreateSegmentDto = {
        name: "Test Segment",
        description: "Test Description",
        client: 1,
        instance: 2,
        query: { match_all: {} },
        status: "active",
      };

      const createdSegment = { id: 1, ...createDto };
      mockSegmentsService.create.mockResolvedValue(createdSegment);

      const result = await controller.create(createDto);

      expect(result).toEqual(createdSegment);
      expect(service.create).toHaveBeenCalledWith(createDto);
    });
  });

  describe("update", () => {
    it("should update segment with instance field", async () => {
      const updateDto: UpdateSegmentDto = {
        name: "Updated Segment",
        instance: 3,
      };

      const updateResult = [1];
      mockSegmentsService.update.mockResolvedValue(updateResult);

      const result = await controller.update("1", updateDto);

      expect(result).toEqual(updateResult);
      expect(service.update).toHaveBeenCalledWith(1, updateDto);
    });

    it("should update segment to remove instance", async () => {
      const updateDto: UpdateSegmentDto = {
        instance: null,
      };

      const updateResult = [1];
      mockSegmentsService.update.mockResolvedValue(updateResult);

      const result = await controller.update("1", updateDto);

      expect(result).toEqual(updateResult);
      expect(service.update).toHaveBeenCalledWith(1, updateDto);
    });
  });

  describe("findAll", () => {
    it("should return all segments", async () => {
      const mockSegments = [
        { id: 1, name: "Segment 1", client: 1, instance: null },
        { id: 2, name: "Segment 2", client: 1, instance: 2 },
      ];

      mockSegmentsService.findAll.mockResolvedValue(mockSegments);

      const result = await controller.findAll();

      expect(result).toEqual(mockSegments);
      expect(service.findAll).toHaveBeenCalledTimes(1);
    });
  });

  describe("findOne", () => {
    it("should return a single segment", async () => {
      const mockSegment = { id: 1, name: "Segment 1", client: 1, instance: 2 };

      mockSegmentsService.findOne.mockResolvedValue(mockSegment);

      const result = await controller.findOne("1");

      expect(result).toEqual(mockSegment);
      expect(service.findOne).toHaveBeenCalledWith(1);
    });
  });

  describe("remove", () => {
    it("should remove a segment", async () => {
      const removeResult = 1;

      mockSegmentsService.remove.mockResolvedValue(removeResult);

      const result = await controller.remove("1");

      expect(result).toEqual(removeResult);
      expect(service.remove).toHaveBeenCalledWith(1);
    });
  });

  describe("findResults", () => {
    it("should find segment results without instance filter", async () => {
      const mockResults = {
        total: 100,
        ids: ["id1", "id2", "id3"],
        after_key: "next_page_key",
      };

      mockSegmentsService.findResults.mockResolvedValue(mockResults);

      const result = await controller.findResults("1");

      expect(result).toEqual(mockResults);
      expect(service.findResults).toHaveBeenCalledWith(1, 100, undefined);
    });

    it("should find segment results with custom size", async () => {
      const mockResults = {
        total: 50,
        ids: ["id1", "id2"],
        after_key: undefined,
      };

      mockSegmentsService.findResults.mockResolvedValue(mockResults);

      const result = await controller.findResults("1", "50");

      expect(result).toEqual(mockResults);
      expect(service.findResults).toHaveBeenCalledWith(1, 50, undefined);
    });

    it("should find segment results with pagination", async () => {
      const mockResults = {
        total: 25,
        ids: ["id4", "id5"],
        after_key: undefined,
      };

      mockSegmentsService.findResults.mockResolvedValue(mockResults);

      const result = await controller.findResults("1", "25", "page_key");

      expect(result).toEqual(mockResults);
      expect(service.findResults).toHaveBeenCalledWith(1, 25, "page_key");
    });
  });

  describe("getMapping", () => {
    it("should get mapping for client", async () => {
      const mockMapping = {
        "user.id": { type: "keyword" },
        "user.name": { type: "text" },
        "device.id": { type: "keyword" },
      };

      mockSegmentsService.getMapping.mockResolvedValue(mockMapping);

      const result = await controller.getMapping("1");

      expect(result).toEqual(mockMapping);
      expect(service.getMapping).toHaveBeenCalledWith(1);
    });
  });

  describe("Guards and Permissions", () => {
    it("should be protected by JwtAuthGuard", () => {
      const guards = Reflect.getMetadata("__guards__", SegmentsController);
      expect(guards).toContain(JwtAuthGuard);
    });

    it("should be protected by PermissionsGuard", () => {
      const guards = Reflect.getMetadata("__guards__", SegmentsController);
      expect(guards).toContain(PermissionsGuard);
    });

    it("should require segments.management permission for preview", () => {
      const permissions = Reflect.getMetadata(
        "permissions",
        controller.preview,
      );
      expect(permissions).toEqual(["segments.management"]);
    });

    it("should require segments.management permission for create", () => {
      const permissions = Reflect.getMetadata("permissions", controller.create);
      expect(permissions).toEqual(["segments.management"]);
    });

    it("should require segments.management permission for update", () => {
      const permissions = Reflect.getMetadata("permissions", controller.update);
      expect(permissions).toEqual(["segments.management"]);
    });

    it("should require segments.management permission for remove", () => {
      const permissions = Reflect.getMetadata("permissions", controller.remove);
      expect(permissions).toEqual(["segments.management"]);
    });

    it("should require instance.management permission for findResults", () => {
      const permissions = Reflect.getMetadata(
        "permissions",
        controller.findResults,
      );
      expect(permissions).toEqual(["instance.management"]);
    });

    it("should require instance.management permission for getMapping", () => {
      const permissions = Reflect.getMetadata(
        "permissions",
        controller.getMapping,
      );
      expect(permissions).toEqual(["instance.management"]);
    });

    it("should not require special permissions for findAll", () => {
      const permissions = Reflect.getMetadata(
        "permissions",
        controller.findAll,
      );
      expect(permissions).toBeUndefined();
    });

    it("should not require special permissions for findOne", () => {
      const permissions = Reflect.getMetadata(
        "permissions",
        controller.findOne,
      );
      expect(permissions).toBeUndefined();
    });
  });
});
