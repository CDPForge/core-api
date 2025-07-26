import { Test, TestingModule } from "@nestjs/testing";
import { OpensearchProvider } from "./opensearch.provider";

describe("Opensearch", () => {
  let provider: OpensearchProvider;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [OpensearchProvider],
    }).compile();

    provider = module.get<OpensearchProvider>(OpensearchProvider);
  });

  it("should be defined", () => {
    expect(provider).toBeDefined();
  });
});
