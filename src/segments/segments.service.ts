import {Injectable, NotFoundException} from "@nestjs/common";
import {InjectModel} from "@nestjs/sequelize";
import {Segment} from "./entities/segment.entity";
import {CreateSegmentDto} from "./dto/create-segment.dto";
import {UpdateSegmentDto} from "./dto/update-segment.dto";
import {OpensearchProvider} from "../opensearch/opensearch.provider";
import {Client} from "@opensearch-project/opensearch";

@Injectable()
export class SegmentsService {
  private readonly osClient: Client;

  constructor(
    @InjectModel(Segment)
    private segmentModel: typeof Segment,
    private readonly osProvider: OpensearchProvider,
  ) {
    this.osClient = this.osProvider.getClient();
  }

  create(createSegmentDto: CreateSegmentDto): Promise<Segment> {
    return this.segmentModel.create(createSegmentDto as any);
  }

  findAll() {
    return this.segmentModel.findAll();
  }

  findOne(id: number) {
    return this.segmentModel.findByPk(id);
  }

  update(id: number, updateSegmentDto: UpdateSegmentDto) {
    return this.segmentModel.update(updateSegmentDto, { where: { id } });
  }

  remove(id: number) {
    return this.segmentModel.destroy({ where: { id } });
  }

  async findResults(id: number, size: number = 10, after_key?: string) {
    const segment: Segment | null = await this.findOne(id);
    if (!segment) {
      throw new Error("Segment not found");
    }

    const index = "users-logs-" + segment.get("client");
    const queryBody: Record<string, any> = segment.get("query") as Record<
      string,
      any
    >;

    const aggregationBody: {
      size: number;
      query: Record<string, any>;
      aggs: {
        ids: {
          composite: {
            size: number;
            sources: Array<{
              id: {
                terms: {
                  field: string;
                };
              };
            }>;
            after?: Record<string, any>;
          };
        };
      };
    } = {
      size: 0, // Imposta a 0 perché non vogliamo documenti, ma solo aggregazioni
      query: queryBody,
      aggs: {
        ids: {
          composite: {
            size: size,
            sources: [
              {
                id: {
                  terms: {
                    field: "device.id",
                  },
                },
              },
            ],
          },
        },
      },
    };

    if (after_key) {
      aggregationBody.aggs.ids.composite["after"] = JSON.parse(
        atob(after_key),
      ) as Record<string, any>;
    }

    const response = await this.osClient.search({
      index,
      body: aggregationBody,
    });

    const aggregationResults = response.body.aggregations?.ids as {
      buckets: Array<{ key: { id: string } }>;
      after_key?: Record<string, any>;
    };
    const ids = aggregationResults.buckets.map((bucket) => bucket.key.id);

    return {
      segment_id: id,
      total: aggregationResults.buckets.length, // Il conteggio è solo per la pagina corrente
      ids: ids,
      after_key: aggregationResults.after_key
        ? btoa(JSON.stringify(aggregationResults.after_key))
        : undefined,
    };
  }

  async getMapping(clientId: number) {
    const indexAlias = `users-logs-${clientId}`;

    // Get all indices matching the pattern
    const indicesResponseRaw = await this.osClient.indices.getAlias({
      name: indexAlias,
    });

    // Find the key (index name) where the alias has is_write_index: true
    const writeIndex = Object.keys(indicesResponseRaw.body).find(
      (indexName) => {
        return indicesResponseRaw.body[indexName].aliases?.[indexAlias]
          ?.is_write_index;
      },
    );

    if (writeIndex == null) {
      throw new NotFoundException(`No indices found for client ${clientId}`);
    }

    // Get the mapping for the latest index
    const mappingResponse = await this.osClient.indices.getMapping({
      index: writeIndex,
    });

    // Transform the properties into the format expected by the frontend
    return mappingResponse.body?.[writeIndex]?.mappings?.properties || {};
  }
}
