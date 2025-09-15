import { Test, TestingModule } from "@nestjs/testing";
import { ClientsController } from "./clients.controller";
import { ClientsService } from "./clients.service";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { PermissionsGuard } from "../auth/permission.guard";

const mockClientsService = {
  create: jest.fn(),
  findAll: jest.fn(),
  findAllWithInstances: jest.fn(),
  findOne: jest.fn(),
  update: jest.fn(),
  remove: jest.fn(),
};

const mockJwtAuthGuard = {
  canActivate: jest.fn().mockReturnValue(true),
};

const mockPermissionsGuard = {
  canActivate: jest.fn().mockReturnValue(true),
};

describe("ClientsController", () => {
  let controller: ClientsController;
  let service: ClientsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ClientsController],
      providers: [
        {
          provide: ClientsService,
          useValue: mockClientsService,
        },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue(mockJwtAuthGuard)
      .overrideGuard(PermissionsGuard)
      .useValue(mockPermissionsGuard)
      .compile();

    controller = module.get<ClientsController>(ClientsController);
    service = module.get<ClientsService>(ClientsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should be defined", () => {
    expect(controller).toBeDefined();
  });

  describe("findAllWithInstances", () => {
    it("should return clients with instances", async () => {
      const mockClientsWithInstances = [
        {
          id: 1,
          name: "Client 1",
          instances: [
            { id: 1, name: "Instance 1", active: true },
            { id: 2, name: "Instance 2", active: false },
          ],
        },
        {
          id: 2,
          name: "Client 2",
          instances: [{ id: 3, name: "Instance 3", active: true }],
        },
      ];

      mockClientsService.findAllWithInstances.mockResolvedValue(
        mockClientsWithInstances,
      );

      const result = await controller.findAllWithInstances();

      expect(result).toEqual(mockClientsWithInstances);
      expect(service.findAllWithInstances).toHaveBeenCalledTimes(1);
      expect(service.findAllWithInstances).toHaveBeenCalledWith();
    });

    it("should return empty array when no clients exist", async () => {
      mockClientsService.findAllWithInstances.mockResolvedValue([]);

      const result = await controller.findAllWithInstances();

      expect(result).toEqual([]);
      expect(service.findAllWithInstances).toHaveBeenCalledTimes(1);
    });

    it("should handle clients with no instances", async () => {
      const mockClientsWithoutInstances = [
        {
          id: 1,
          name: "Client 1",
          instances: [],
        },
      ];

      mockClientsService.findAllWithInstances.mockResolvedValue(
        mockClientsWithoutInstances,
      );

      const result = await controller.findAllWithInstances();

      expect(result).toEqual(mockClientsWithoutInstances);
      expect(result[0].instances).toEqual([]);
    });

    it("should propagate service errors", async () => {
      const serviceError = new Error("Database connection failed");
      mockClientsService.findAllWithInstances.mockRejectedValue(serviceError);

      await expect(controller.findAllWithInstances()).rejects.toThrow(
        "Database connection failed",
      );
    });

    it("should handle large datasets", async () => {
      const largeDataset = Array.from({ length: 100 }, (_, i) => ({
        id: i + 1,
        name: `Client ${i + 1}`,
        instances: Array.from({ length: 5 }, (_, j) => ({
          id: i * 5 + j + 1,
          name: `Instance ${j + 1}`,
          active: j % 2 === 0,
        })),
      }));

      mockClientsService.findAllWithInstances.mockResolvedValue(largeDataset);

      const result = await controller.findAllWithInstances();

      expect(result).toHaveLength(100);
      expect(result[0].instances).toHaveLength(5);
    });

    it("should handle mixed active/inactive instances", async () => {
      const mockClientsWithMixedInstances = [
        {
          id: 1,
          name: "Client 1",
          instances: [
            { id: 1, name: "Active Instance", active: true },
            { id: 2, name: "Inactive Instance", active: false },
            { id: 3, name: "Another Active", active: true },
          ],
        },
      ];

      mockClientsService.findAllWithInstances.mockResolvedValue(
        mockClientsWithMixedInstances,
      );

      const result = await controller.findAllWithInstances();

      expect(result[0].instances).toHaveLength(3);
      expect(result[0].instances.filter((i) => i.active)).toHaveLength(2);
      expect(result[0].instances.filter((i) => !i.active)).toHaveLength(1);
    });

    it("should handle null or undefined instances gracefully", async () => {
      const mockClientsWithNullInstances = [
        {
          id: 1,
          name: "Client 1",
          instances: null,
        },
      ];

      mockClientsService.findAllWithInstances.mockResolvedValue(
        mockClientsWithNullInstances,
      );

      const result = await controller.findAllWithInstances();

      expect(result).toEqual(mockClientsWithNullInstances);
    });

    it("should handle timeout errors", async () => {
      const timeoutError = new Error("Query timeout");
      timeoutError.name = "TimeoutError";
      mockClientsService.findAllWithInstances.mockRejectedValue(timeoutError);

      await expect(controller.findAllWithInstances()).rejects.toThrow(
        "Query timeout",
      );
    });

    it("should handle database constraint errors", async () => {
      const constraintError = new Error("Foreign key constraint failed");
      constraintError.name = "SequelizeForeignKeyConstraintError";
      mockClientsService.findAllWithInstances.mockRejectedValue(
        constraintError,
      );

      await expect(controller.findAllWithInstances()).rejects.toThrow(
        "Foreign key constraint failed",
      );
    });

    it("should return consistent data structure", async () => {
      const mockData = [
        {
          id: 1,
          name: "Client 1",
          createdAt: "2023-01-01T00:00:00.000Z",
          updatedAt: "2023-01-01T00:00:00.000Z",
          instances: [
            {
              id: 1,
              name: "Instance 1",
              description: "Test instance",
              active: true,
            },
          ],
        },
      ];

      mockClientsService.findAllWithInstances.mockResolvedValue(mockData);

      const result = await controller.findAllWithInstances();

      expect(result[0]).toHaveProperty("id");
      expect(result[0]).toHaveProperty("name");
      expect(result[0]).toHaveProperty("instances");
      expect(Array.isArray(result[0].instances)).toBe(true);
      if (result[0].instances.length > 0) {
        expect(result[0].instances[0]).toHaveProperty("id");
        expect(result[0].instances[0]).toHaveProperty("name");
        expect(result[0].instances[0]).toHaveProperty("active");
      }
    });
  });

  describe("create", () => {
    it("should create a new client", async () => {
      const createClientDto = { name: "New Client" };
      const createdClient = { id: 1, ...createClientDto };

      mockClientsService.create.mockResolvedValue(createdClient);

      const result = await controller.create(createClientDto);

      expect(result).toEqual(createdClient);
      expect(service.create).toHaveBeenCalledWith(createClientDto);
    });

    it("should handle creation errors", async () => {
      const createClientDto = { name: "New Client" };
      const serviceError = new Error("Creation failed");

      mockClientsService.create.mockRejectedValue(serviceError);

      await expect(controller.create(createClientDto)).rejects.toThrow(
        "Creation failed",
      );
    });
  });

  describe("findAll", () => {
    it("should return all clients", async () => {
      const mockClients = [
        { id: 1, name: "Client 1" },
        { id: 2, name: "Client 2" },
      ];

      mockClientsService.findAll.mockResolvedValue(mockClients);

      const result = await controller.findAll();

      expect(result).toEqual(mockClients);
      expect(service.findAll).toHaveBeenCalledTimes(1);
    });
  });

  describe("findOne", () => {
    it("should return a single client", async () => {
      const mockClient = { id: 1, name: "Client 1" };

      mockClientsService.findOne.mockResolvedValue(mockClient);

      const result = await controller.findOne("1");

      expect(result).toEqual(mockClient);
      expect(service.findOne).toHaveBeenCalledWith(1);
    });

    it("should handle string id parameter", async () => {
      const mockClient = { id: 123, name: "Client 123" };

      mockClientsService.findOne.mockResolvedValue(mockClient);

      await controller.findOne("123");

      expect(service.findOne).toHaveBeenCalledWith(123);
    });

    it("should return null for non-existent client", async () => {
      mockClientsService.findOne.mockResolvedValue(null);

      const result = await controller.findOne("999");

      expect(result).toBeNull();
    });
  });

  describe("update", () => {
    it("should update a client", async () => {
      const updateClientDto = { name: "Updated Client" };
      const updateResult = [1];

      mockClientsService.update.mockResolvedValue(updateResult);

      const result = await controller.update("1", updateClientDto);

      expect(result).toEqual(updateResult);
      expect(service.update).toHaveBeenCalledWith(1, updateClientDto);
    });

    it("should handle string id parameter for update", async () => {
      const updateClientDto = { name: "Updated Client" };

      await controller.update("456", updateClientDto);

      expect(service.update).toHaveBeenCalledWith(456, updateClientDto);
    });
  });

  describe("remove", () => {
    it("should remove a client", async () => {
      const removeResult = 1;

      mockClientsService.remove.mockResolvedValue(removeResult);

      const result = await controller.remove("1");

      expect(result).toEqual(removeResult);
      expect(service.remove).toHaveBeenCalledWith(1);
    });

    it("should handle string id parameter for removal", async () => {
      await controller.remove("789");

      expect(service.remove).toHaveBeenCalledWith(789);
    });

    it("should return 0 when client not found", async () => {
      mockClientsService.remove.mockResolvedValue(0);

      const result = await controller.remove("999");

      expect(result).toEqual(0);
    });
  });

  describe("Guards", () => {
    it("should be protected by JwtAuthGuard", () => {
      const guards = Reflect.getMetadata("__guards__", ClientsController);
      expect(guards).toContain(JwtAuthGuard);
    });

    it("should be protected by PermissionsGuard", () => {
      const guards = Reflect.getMetadata("__guards__", ClientsController);
      expect(guards).toContain(PermissionsGuard);
    });
  });

  describe("Decorators", () => {
    it("should have IsSuperAdmin decorator on create method", () => {
      const isSuperAdmin = Reflect.getMetadata(
        "isSuperAdmin",
        controller.create,
      );
      expect(isSuperAdmin).toBe(true);
    });

    it("should have IsSuperAdmin decorator on update method", () => {
      const isSuperAdmin = Reflect.getMetadata(
        "isSuperAdmin",
        controller.update,
      );
      expect(isSuperAdmin).toBe(true);
    });

    it("should not have IsSuperAdmin decorator on findAll method", () => {
      const isSuperAdmin = Reflect.getMetadata(
        "isSuperAdmin",
        controller.findAll,
      );
      expect(isSuperAdmin).toBeUndefined();
    });

    it("should not have IsSuperAdmin decorator on findAllWithInstances method", () => {
      const isSuperAdmin = Reflect.getMetadata(
        "isSuperAdmin",
        controller.findAllWithInstances,
      );
      expect(isSuperAdmin).toBeUndefined();
    });
  });
});
