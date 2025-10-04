import { Injectable, NotFoundException } from "@nestjs/common";
import { Segment } from "./entities/segment.entity";
import { UpdateSegmentDto } from "./dto/update-segment.dto";
import { PreviewSegmentDto } from "./dto/preview-segment.dto";
import { PreviewResult } from "./interfaces/preview-result.interface";
import { OpensearchProvider } from "../opensearch/opensearch.provider";
import { Client } from "@opensearch-project/opensearch";

@Injectable()
export class SegmentsService {
  private readonly osClient: Client;

  constructor(private readonly osProvider: OpensearchProvider) {
    this.osClient = this.osProvider.getClient();
  }

  create(createSegmentDto: Partial<Segment>): Promise<Segment> {
    return Segment.create(createSegmentDto);
  }

  findAll() {
    return Segment.findAll();
  }

  findOne(id: number) {
    return Segment.findByPk(id);
  }

  update(id: number, updateSegmentDto: UpdateSegmentDto) {
    return Segment.update(updateSegmentDto, { where: { id } });
  }

  remove(id: number) {
    return Segment.destroy({ where: { id } });
  }

  private buildQueryWithInstanceFilter(
    baseQuery: Record<string, any>,
    instanceId?: number,
  ): Record<string, any> {
    if (!instanceId) {
      return baseQuery;
    }

    // Add instance filter to the query
    const queryWithBool = baseQuery as { bool?: { must?: unknown[] } };
    if (queryWithBool.bool) {
      if (!queryWithBool.bool.must) {
        queryWithBool.bool.must = [];
      }
      queryWithBool.bool.must.push({
        term: { "instance.id": instanceId },
      });
      return queryWithBool;
    } else {
      return {
        bool: {
          must: [baseQuery, { term: { "instance.id": instanceId } }],
        },
      };
    }
  }

  async findResults(id: number, size: number = 10, after_key?: string) {
    const segment: Segment | null = await this.findOne(id);
    if (!segment) {
      throw new Error("Segment not found");
    }

    const index = "users-logs-" + segment.get("client");
    const baseQuery: Record<string, any> = segment.get("query") as Record<
      string,
      any
    >;
    const instanceId = segment.get("instance") as number | null;

    // Apply instance filtering if segment has an instance
    const queryBody = this.buildQueryWithInstanceFilter(
      baseQuery,
      instanceId || undefined,
    );

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

  async preview(previewDto: PreviewSegmentDto): Promise<PreviewResult> {
    const startTime = Date.now();
    const { clientId, instanceId, query } = previewDto as {
      clientId: number;
      instanceId?: number;
      query: Record<string, unknown>;
    };

    const index = `users-logs-${clientId}`;

    // Build the query with optional instance filtering
    const finalQuery = this.buildQueryWithInstanceFilter(query, instanceId);

    try {
      // Use cardinality aggregation to count unique device.id values
      const response = (await this.osClient.search({
        index,
        body: {
          size: 0, // We don't need the actual documents, just the aggregation
          query: finalQuery,
          aggs: {
            unique_devices: {
              cardinality: {
                field: "device.id",
              },
            },
          },
        },
      })) as unknown as {
        body: { aggregations: { unique_devices: { value: number } } };
      };

      const executionTime = Date.now() - startTime;

      // Type-safe access to cardinality aggregation result
      interface CardinalityAggregation {
        value: number;
      }

      const cardinalityResult = response.body.aggregations
        ?.unique_devices as CardinalityAggregation;
      const count = cardinalityResult?.value || 0;

      return {
        estimatedCount: count,
        executionTime,
        hasMore: count > 10000, // Indicate if there might be more results than what we can efficiently count
      };
    } catch (error) {
      throw new Error(
        `Preview calculation failed: ${(error as Error).message}`,
      );
    }
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
