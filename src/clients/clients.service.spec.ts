import { Test, TestingModule } from "@nestjs/testing";
import { ClientsService } from "./clients.service";
import { getModelToken } from "@nestjs/sequelize";
import { Client } from "./entities/client.entity";
import { Instance } from "../instances/entities/instance.entity";
import { OpensearchProvider } from "../opensearch/opensearch.provider";
import { SettingsService } from "../settings/settings.service";

const mockClient = {
  id: 1,
  name: "Test Client",
  createdAt: new Date(),
  updatedAt: new Date(),
};

const mockClientWithInstances = {
  id: 1,
  name: "Test Client",
  createdAt: new Date(),
  updatedAt: new Date(),
  instances: [
    {
      id: 1,
      name: "Instance 1",
      description: "Test Instance 1",
      active: true,
    },
    {
      id: 2,
      name: "Instance 2",
      description: "Test Instance 2",
      active: true,
    },
    {
      id: 3,
      name: "Instance 3",
      description: "Test Instance 3",
      active: false,
    },
  ],
};

const mockClientModel = {
  create: jest.fn().mockResolvedValue(mockClient),
  findAll: jest.fn(),
  findByPk: jest.fn().mockResolvedValue(mockClient),
  update: jest.fn().mockResolvedValue([1]),
  destroy: jest.fn().mockResolvedValue(1),
};

const mockOpensearchProvider = {
  getClient: jest.fn().mockReturnValue({
    indices: {
      create: jest.fn().mockResolvedValue({ acknowledged: true }),
    },
  }),
};

const mockSettingsService = {
  get: jest.fn().mockResolvedValue('{"settings": {"number_of_shards": 1}}'),
};

describe("ClientsService", () => {
  let service: ClientsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ClientsService,
        {
          provide: getModelToken(Client),
          useValue: mockClientModel,
        },
        {
          provide: OpensearchProvider,
          useValue: mockOpensearchProvider,
        },
        {
          provide: SettingsService,
          useValue: mockSettingsService,
        },
      ],
    }).compile();

    service = module.get<ClientsService>(ClientsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  describe("findAllWithInstances", () => {
    it("should return clients with their instances", async () => {
      mockClientModel.findAll.mockResolvedValue([mockClientWithInstances]);

      const result = await service.findAllWithInstances();

      expect(result).toEqual([mockClientWithInstances]);
      expect(mockClientModel.findAll).toHaveBeenCalledWith({
        include: [
          {
            model: Instance,
            attributes: ["id", "name", "description", "active"],
            required: false,
          },
        ],
        order: [
          ["id", "ASC"],
          [Instance, "name", "ASC"],
        ],
      });
    });

    it("should return clients with empty instances array when no instances exist", async () => {
      const clientWithoutInstances = {
        ...mockClient,
        instances: [],
      };
      mockClientModel.findAll.mockResolvedValue([clientWithoutInstances]);

      const result = await service.findAllWithInstances();

      expect(result).toEqual([clientWithoutInstances]);
      expect(result[0].instances).toEqual([]);
    });

    it("should return multiple clients with their respective instances", async () => {
      const client1 = {
        id: 1,
        name: "Client 1",
        instances: [
          { id: 1, name: "Instance 1", active: true },
          { id: 2, name: "Instance 2", active: false },
        ],
      };
      const client2 = {
        id: 2,
        name: "Client 2",
        instances: [{ id: 3, name: "Instance 3", active: true }],
      };

      mockClientModel.findAll.mockResolvedValue([client1, client2]);

      const result = await service.findAllWithInstances();

      expect(result).toHaveLength(2);
      expect(result[0].instances).toHaveLength(2);
      expect(result[1].instances).toHaveLength(1);
    });

    it("should include both active and inactive instances", async () => {
      mockClientModel.findAll.mockResolvedValue([mockClientWithInstances]);

      const result = await service.findAllWithInstances();

      const instances = result[0].instances;
      expect(instances).toHaveLength(3);
      expect(instances?.filter((i) => i.active)).toHaveLength(2);
      expect(instances?.filter((i) => !i.active)).toHaveLength(1);
    });

    it("should order results by client id and instance name", async () => {
      mockClientModel.findAll.mockResolvedValue([mockClientWithInstances]);

      await service.findAllWithInstances();

      expect(mockClientModel.findAll).toHaveBeenCalledWith(
        expect.objectContaining({
          order: [
            ["id", "ASC"],
            [Instance, "name", "ASC"],
          ],
        }),
      );
    });

    it("should handle database errors gracefully", async () => {
      const dbError = new Error("Database connection failed");
      mockClientModel.findAll.mockRejectedValue(dbError);

      await expect(service.findAllWithInstances()).rejects.toThrow(
        "Database connection failed",
      );
    });

    it("should use left join to include clients without instances", async () => {
      await service.findAllWithInstances();

      expect(mockClientModel.findAll).toHaveBeenCalledWith(
        expect.objectContaining({
          include: [
            expect.objectContaining({
              required: false, // This ensures LEFT JOIN behavior
            }),
          ],
        }),
      );
    });

    it("should only include specific instance attributes", async () => {
      await service.findAllWithInstances();

      expect(mockClientModel.findAll).toHaveBeenCalledWith(
        expect.objectContaining({
          include: [
            expect.objectContaining({
              attributes: ["id", "name", "description", "active"],
            }),
          ],
        }),
      );
    });

    it("should handle large datasets efficiently", async () => {
      const largeDataset = Array.from({ length: 1000 }, (_, i) => ({
        id: i + 1,
        name: `Client ${i + 1}`,
        instances: Array.from({ length: 10 }, (_, j) => ({
          id: i * 10 + j + 1,
          name: `Instance ${j + 1}`,
          active: j % 2 === 0,
        })),
      }));

      mockClientModel.findAll.mockResolvedValue(largeDataset);

      const result = await service.findAllWithInstances();

      expect(result).toHaveLength(1000);
      expect(result[0].instances).toHaveLength(10);
    });

    it("should handle null instances gracefully", async () => {
      const clientWithNullInstances = {
        ...mockClient,
        instances: null,
      };
      mockClientModel.findAll.mockResolvedValue([clientWithNullInstances]);

      const result = await service.findAllWithInstances();

      expect(result).toEqual([clientWithNullInstances]);
    });

    it("should handle connection timeout errors", async () => {
      const timeoutError = new Error("Connection timeout");
      timeoutError.name = "SequelizeConnectionTimedOutError";
      mockClientModel.findAll.mockRejectedValue(timeoutError);

      await expect(service.findAllWithInstances()).rejects.toThrow(
        "Connection timeout",
      );
    });

    it("should handle validation errors", async () => {
      const validationError = new Error("Validation failed");
      validationError.name = "SequelizeValidationError";
      mockClientModel.findAll.mockRejectedValue(validationError);

      await expect(service.findAllWithInstances()).rejects.toThrow(
        "Validation failed",
      );
    });

    it("should maintain data integrity with concurrent requests", async () => {
      const mockData = [mockClientWithInstances];
      mockClientModel.findAll.mockResolvedValue(mockData);

      // Simulate concurrent requests
      const promises = Array.from({ length: 5 }, () =>
        service.findAllWithInstances(),
      );
      const results = await Promise.all(promises);

      // All results should be identical
      results.forEach((result) => {
        expect(result).toEqual(mockData);
      });

      // Should have been called 5 times
      expect(mockClientModel.findAll).toHaveBeenCalledTimes(5);
    });

    it("should handle instances with missing optional fields", async () => {
      const clientWithPartialInstances = {
        ...mockClient,
        instances: [
          { id: 1, name: "Instance 1", active: true }, // Missing description
          { id: 2, name: "Instance 2", description: null, active: false },
        ],
      };
      mockClientModel.findAll.mockResolvedValue([clientWithPartialInstances]);

      const result = await service.findAllWithInstances();

      expect(result[0].instances).toHaveLength(2);
      expect(result[0].instances[0]).not.toHaveProperty("description");
      expect(result[0].instances[1].description).toBeNull();
    });
  });

  describe("create", () => {
    it("should create a client and corresponding OpenSearch index", async () => {
      const clientData = { name: "New Client" };
      const createdClient = { ...mockClient, ...clientData };

      mockClientModel.create.mockResolvedValue(createdClient);

      const result = await service.create(clientData);

      expect(result).toEqual(createdClient);
      expect(mockClientModel.create).toHaveBeenCalledWith(
        clientData,
        undefined,
      );
      expect(mockSettingsService.get).toHaveBeenCalledWith("os.indexsetting");

      const mockOsClient = mockOpensearchProvider.getClient();
      expect(mockOsClient.indices.create).toHaveBeenCalledWith({
        index: `users-logs-${createdClient.id}-000001`,
        body: { settings: { number_of_shards: 1 } },
      });
    });

    it("should handle missing index setting", async () => {
      mockSettingsService.get.mockResolvedValue(null);

      await expect(service.create({ name: "Test" })).rejects.toThrow(
        "Index setting not found",
      );
    });

    it("should replace client_id placeholder in index template", async () => {
      const clientData = { name: "New Client" };
      const createdClient = { id: 123, ...clientData };
      const indexTemplate = '{"settings": {"client_id": "${client_id}"}}';

      mockClientModel.create.mockResolvedValue(createdClient);
      mockSettingsService.get.mockResolvedValue(indexTemplate);

      await service.create(clientData);

      const mockOsClient = mockOpensearchProvider.getClient();
      expect(mockOsClient.indices.create).toHaveBeenCalledWith({
        index: "users-logs-123-000001",
        body: { settings: { client_id: "123" } },
      });
    });
  });

  describe("findAll", () => {
    it("should return clients with instance count", async () => {
      const clientsWithCount = [{ ...mockClient, instancesCount: 2 }];
      mockClientModel.findAll.mockResolvedValue(clientsWithCount);

      const result = await service.findAll();

      expect(result).toEqual(clientsWithCount);
      expect(mockClientModel.findAll).toHaveBeenCalledWith(
        expect.objectContaining({
          attributes: expect.objectContaining({
            include: expect.arrayContaining([
              expect.arrayContaining([
                "COUNT",
                expect.anything(),
                "instancesCount",
              ]),
            ]),
          }),
          include: [
            expect.objectContaining({
              model: Instance,
              attributes: [],
              required: false,
            }),
          ],
          group: ["Client.id"],
        }),
      );
    });
  });

  describe("findOne", () => {
    it("should return a single client with instance count", async () => {
      const clientWithCount = { ...mockClient, instancesCount: 1 };
      mockClientModel.findByPk.mockResolvedValue(clientWithCount);

      const result = await service.findOne(1);

      expect(result).toEqual(clientWithCount);
      expect(mockClientModel.findByPk).toHaveBeenCalledWith(
        1,
        expect.any(Object),
      );
    });

    it("should return null for non-existent client", async () => {
      mockClientModel.findByPk.mockResolvedValue(null);

      const result = await service.findOne(999);

      expect(result).toBeNull();
    });
  });

  describe("update", () => {
    it("should update a client", async () => {
      const updateData = { name: "Updated Client" };

      const result = await service.update(1, updateData);

      expect(result).toEqual([1]);
      expect(mockClientModel.update).toHaveBeenCalledWith(
        updateData,
        expect.objectContaining({
          where: { id: 1 },
        }),
      );
    });

    it("should handle update with transaction", async () => {
      const updateData = { name: "Updated Client" };
      const transaction = {} as any;

      await service.update(1, updateData, { transaction });

      expect(mockClientModel.update).toHaveBeenCalledWith(
        updateData,
        expect.objectContaining({
          where: { id: 1 },
          transaction,
        }),
      );
    });
  });

  describe("remove", () => {
    it("should remove a client", async () => {
      const result = await service.remove(1);

      expect(result).toEqual(1);
      expect(mockClientModel.destroy).toHaveBeenCalledWith({
        where: { id: 1 },
      });
    });

    it("should handle remove with transaction", async () => {
      const transaction = {} as any;

      await service.remove(1, { transaction });

      expect(mockClientModel.destroy).toHaveBeenCalledWith({
        where: { id: 1 },
        transaction,
      });
    });

    it("should return 0 when client not found", async () => {
      mockClientModel.destroy.mockResolvedValue(0);

      const result = await service.remove(999);

      expect(result).toEqual(0);
    });
  });
});
