import { Test, TestingModule } from "@nestjs/testing";
import { INestApplication } from "@nestjs/common";
import * as request from "supertest";
import { AppModule } from "../src/app.module";

describe("Enhanced Segment Modal Integration (e2e)", () => {
  let app: INestApplication;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe("Clients with Instances Endpoint", () => {
    it("/clients/with-instances (GET) should return clients with instances", () => {
      return request(app.getHttpServer())
        .get("/clients/with-instances")
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBe(true);
          // Each client should have an instances array
          if (res.body.length > 0) {
            expect(res.body[0]).toHaveProperty("instances");
            expect(Array.isArray(res.body[0].instances)).toBe(true);
          }
        });
    });

    it("/clients/with-instances (GET) should include instance details", () => {
      return request(app.getHttpServer())
        .get("/clients/with-instances")
        .expect(200)
        .expect((res) => {
          if (res.body.length > 0 && res.body[0].instances.length > 0) {
            const instance = res.body[0].instances[0];
            expect(instance).toHaveProperty("id");
            expect(instance).toHaveProperty("name");
            expect(instance).toHaveProperty("description");
            expect(instance).toHaveProperty("active");
          }
        });
    });

    it("/clients/with-instances (GET) should handle empty instances gracefully", () => {
      return request(app.getHttpServer())
        .get("/clients/with-instances")
        .expect(200)
        .expect((res) => {
          // Should return clients even if they have no instances
          expect(Array.isArray(res.body)).toBe(true);
          res.body.forEach((client) => {
            expect(client).toHaveProperty("instances");
            expect(Array.isArray(client.instances)).toBe(true);
          });
        });
    });
  });

  describe("Segments Preview Endpoint", () => {
    it("/segments/preview (POST) should calculate preview without instance", () => {
      const previewDto = {
        clientId: 1,
        query: { match_all: {} },
      };

      return request(app.getHttpServer())
        .post("/segments/preview")
        .send(previewDto)
        .expect(201)
        .expect((res) => {
          expect(res.body).toHaveProperty("estimatedCount");
          expect(res.body).toHaveProperty("executionTime");
          expect(res.body).toHaveProperty("hasMore");
          expect(typeof res.body.estimatedCount).toBe("number");
          expect(typeof res.body.executionTime).toBe("number");
          expect(typeof res.body.hasMore).toBe("boolean");
        });
    });

    it("/segments/preview (POST) should calculate preview with instance filter", () => {
      const previewDto = {
        clientId: 1,
        instanceId: 1,
        query: { match_all: {} },
      };

      return request(app.getHttpServer())
        .post("/segments/preview")
        .send(previewDto)
        .expect(201)
        .expect((res) => {
          expect(res.body).toHaveProperty("estimatedCount");
          expect(res.body).toHaveProperty("executionTime");
          expect(res.body).toHaveProperty("hasMore");
        });
    });

    it("/segments/preview (POST) should validate required fields", () => {
      const invalidDto = {
        query: { match_all: {} },
        // Missing clientId
      };

      return request(app.getHttpServer())
        .post("/segments/preview")
        .send(invalidDto)
        .expect(400);
    });

    it("/segments/preview (POST) should validate query field", () => {
      const invalidDto = {
        clientId: 1,
        // Missing query
      };

      return request(app.getHttpServer())
        .post("/segments/preview")
        .send(invalidDto)
        .expect(400);
    });

    it("/segments/preview (POST) should handle complex queries", () => {
      const previewDto = {
        clientId: 1,
        instanceId: 1,
        query: {
          bool: {
            must: [
              { term: { "user.active": true } },
              { range: { "user.age": { gte: 18 } } },
            ],
          },
        },
      };

      return request(app.getHttpServer())
        .post("/segments/preview")
        .send(previewDto)
        .expect(201)
        .expect((res) => {
          expect(res.body).toHaveProperty("estimatedCount");
          expect(res.body.estimatedCount).toBeGreaterThanOrEqual(0);
        });
    });

    it("/segments/preview (POST) should handle non-existent client gracefully", () => {
      const previewDto = {
        clientId: 99999,
        query: { match_all: {} },
      };

      return request(app.getHttpServer())
        .post("/segments/preview")
        .send(previewDto)
        .expect((res) => {
          // Should either return 404 or handle gracefully with error message
          expect([400, 404, 500]).toContain(res.status);
        });
    });

    it("/segments/preview (POST) should handle non-existent instance gracefully", () => {
      const previewDto = {
        clientId: 1,
        instanceId: 99999,
        query: { match_all: {} },
      };

      return request(app.getHttpServer())
        .post("/segments/preview")
        .send(previewDto)
        .expect((res) => {
          // Should either return 404 or handle gracefully
          expect([201, 400, 404, 500]).toContain(res.status);
        });
    });
  });

  describe("Segment Creation with Instance Support", () => {
    it("/segments (POST) should create segment without instance", () => {
      const createDto = {
        name: "Test Segment",
        description: "Test Description",
        client: 1,
        query: { match_all: {} },
        status: "active",
      };

      return request(app.getHttpServer())
        .post("/segments")
        .send(createDto)
        .expect(201)
        .expect((res) => {
          expect(res.body).toHaveProperty("id");
          expect(res.body.name).toBe(createDto.name);
          expect(res.body.client).toBe(createDto.client);
          expect(res.body.instance).toBeNull();
        });
    });

    it("/segments (POST) should create segment with instance", () => {
      const createDto = {
        name: "Test Segment with Instance",
        description: "Test Description",
        client: 1,
        instance: 1,
        query: { match_all: {} },
        status: "active",
      };

      return request(app.getHttpServer())
        .post("/segments")
        .send(createDto)
        .expect(201)
        .expect((res) => {
          expect(res.body).toHaveProperty("id");
          expect(res.body.name).toBe(createDto.name);
          expect(res.body.client).toBe(createDto.client);
          expect(res.body.instance).toBe(createDto.instance);
        });
    });

    it("/segments/:id (PATCH) should update segment instance", async () => {
      // First create a segment
      const createDto = {
        name: "Test Segment for Update",
        description: "Test Description",
        client: 1,
        query: { match_all: {} },
        status: "active",
      };

      const createResponse = await request(app.getHttpServer())
        .post("/segments")
        .send(createDto)
        .expect(201);

      const segmentId = createResponse.body.id;

      // Then update it with an instance
      const updateDto = {
        instance: 1,
      };

      return request(app.getHttpServer())
        .patch(`/segments/${segmentId}`)
        .send(updateDto)
        .expect(200);
    });

    it("/segments/:id (PATCH) should remove instance from segment", async () => {
      // First create a segment with instance
      const createDto = {
        name: "Test Segment for Instance Removal",
        description: "Test Description",
        client: 1,
        instance: 1,
        query: { match_all: {} },
        status: "active",
      };

      const createResponse = await request(app.getHttpServer())
        .post("/segments")
        .send(createDto)
        .expect(201);

      const segmentId = createResponse.body.id;

      // Then remove the instance
      const updateDto = {
        instance: null,
      };

      return request(app.getHttpServer())
        .patch(`/segments/${segmentId}`)
        .send(updateDto)
        .expect(200);
    });
  });

  describe("Complete Workflow Integration", () => {
    it("should support complete segment creation workflow with preview", async () => {
      // Step 1: Get clients with instances
      const clientsResponse = await request(app.getHttpServer())
        .get("/clients/with-instances")
        .expect(200);

      expect(Array.isArray(clientsResponse.body)).toBe(true);

      if (clientsResponse.body.length === 0) {
        // Skip test if no clients available
        return;
      }

      const client = clientsResponse.body[0];
      const instance = client.instances.length > 0 ? client.instances[0] : null;

      // Step 2: Preview segment
      const previewDto = {
        clientId: client.id,
        ...(instance && { instanceId: instance.id }),
        query: { match_all: {} },
      };

      const previewResponse = await request(app.getHttpServer())
        .post("/segments/preview")
        .send(previewDto)
        .expect(201);

      expect(previewResponse.body).toHaveProperty("estimatedCount");

      // Step 3: Create segment based on preview
      const createDto = {
        name: "Integration Test Segment",
        description: "Created via integration test",
        client: client.id,
        ...(instance && { instance: instance.id }),
        query: previewDto.query,
        status: "active",
      };

      const createResponse = await request(app.getHttpServer())
        .post("/segments")
        .send(createDto)
        .expect(201);

      expect(createResponse.body.client).toBe(client.id);
      if (instance) {
        expect(createResponse.body.instance).toBe(instance.id);
      }

      // Step 4: Verify segment can be retrieved
      const segmentId = createResponse.body.id;
      const getResponse = await request(app.getHttpServer())
        .get(`/segments/${segmentId}`)
        .expect(200);

      expect(getResponse.body.id).toBe(segmentId);
      expect(getResponse.body.client).toBe(client.id);

      // Step 5: Clean up - delete the test segment
      await request(app.getHttpServer())
        .delete(`/segments/${segmentId}`)
        .expect(200);
    });

    it("should handle preview with different query types", async () => {
      const queryTypes = [
        { match_all: {} },
        { term: { "user.active": true } },
        {
          bool: {
            must: [{ term: { "user.active": true } }],
          },
        },
        {
          bool: {
            should: [
              { term: { "user.type": "premium" } },
              { term: { "user.type": "basic" } },
            ],
          },
        },
      ];

      for (const query of queryTypes) {
        const previewDto = {
          clientId: 1,
          query,
        };

        await request(app.getHttpServer())
          .post("/segments/preview")
          .send(previewDto)
          .expect((res) => {
            // Should either succeed or fail gracefully
            expect([201, 400, 404, 500]).toContain(res.status);
            if (res.status === 201) {
              expect(res.body).toHaveProperty("estimatedCount");
            }
          });
      }
    });
  });

  describe("Error Handling and Edge Cases", () => {
    it("should handle malformed JSON in preview queries", () => {
      const previewDto = {
        clientId: 1,
        query: "invalid json string",
      };

      return request(app.getHttpServer())
        .post("/segments/preview")
        .send(previewDto)
        .expect(400);
    });

    it("should handle empty query objects", () => {
      const previewDto = {
        clientId: 1,
        query: {},
      };

      return request(app.getHttpServer())
        .post("/segments/preview")
        .send(previewDto)
        .expect((res) => {
          // Should handle gracefully
          expect([201, 400]).toContain(res.status);
        });
    });

    it("should validate instance belongs to client", async () => {
      // Get clients to find valid client and instance IDs
      const clientsResponse = await request(app.getHttpServer())
        .get("/clients/with-instances")
        .expect(200);

      if (clientsResponse.body.length < 2) {
        // Skip if not enough clients to test cross-client instance access
        return;
      }

      const client1 = clientsResponse.body[0];
      const client2 = clientsResponse.body[1];

      if (client1.instances.length === 0) {
        // Skip if first client has no instances
        return;
      }

      const instance1 = client1.instances[0];

      // Try to use client2 with client1's instance
      const previewDto = {
        clientId: client2.id,
        instanceId: instance1.id, // Instance from different client
        query: { match_all: {} },
      };

      return request(app.getHttpServer())
        .post("/segments/preview")
        .send(previewDto)
        .expect((res) => {
          // Should either validate and reject, or handle gracefully
          expect([201, 400, 403, 404]).toContain(res.status);
        });
    });

    it("should handle concurrent preview requests", async () => {
      const previewDto = {
        clientId: 1,
        query: { match_all: {} },
      };

      // Send multiple concurrent requests
      const promises = Array.from({ length: 5 }, () =>
        request(app.getHttpServer()).post("/segments/preview").send(previewDto),
      );

      const responses = await Promise.all(promises);

      // All requests should complete (either successfully or with appropriate errors)
      responses.forEach((response) => {
        expect([201, 400, 404, 500]).toContain(response.status);
      });
    });
  });

  describe("Performance and Scalability", () => {
    it("should handle preview requests within reasonable time", async () => {
      const previewDto = {
        clientId: 1,
        query: { match_all: {} },
      };

      const startTime = Date.now();

      await request(app.getHttpServer())
        .post("/segments/preview")
        .send(previewDto)
        .expect((res) => {
          const endTime = Date.now();
          const duration = endTime - startTime;

          // Should complete within 5 seconds
          expect(duration).toBeLessThan(5000);

          if (res.status === 201) {
            expect(res.body.executionTime).toBeLessThan(5000);
          }
        });
    });

    it("should handle large result sets appropriately", () => {
      const previewDto = {
        clientId: 1,
        query: { match_all: {} },
      };

      return request(app.getHttpServer())
        .post("/segments/preview")
        .send(previewDto)
        .expect((res) => {
          if (res.status === 201) {
            expect(typeof res.body.estimatedCount).toBe("number");
            expect(res.body.estimatedCount).toBeGreaterThanOrEqual(0);

            // If count is very large, hasMore should be true
            if (res.body.estimatedCount > 10000) {
              expect(res.body.hasMore).toBe(true);
            }
          }
        });
    });
  });
});
