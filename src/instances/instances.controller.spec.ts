import { Test, TestingModule } from "@nestjs/testing";
import { InstancesController } from "./instances.controller";
import { InstancesService } from "./instances.service";

describe("InstancesController", () => {
  let controller: InstancesController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [InstancesController],
      providers: [InstancesService],
    }).compile();

    controller = module.get<InstancesController>(InstancesController);
  });

  it("should be defined", () => {
    expect(controller).toBeDefined();
  });
});
