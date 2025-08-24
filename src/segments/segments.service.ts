import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Segment } from './entities/segment.entity';
import { CreateSegmentDto } from './dto/create-segment.dto';
import { UpdateSegmentDto } from './dto/update-segment.dto';
import { OpensearchProvider } from '../opensearch/opensearch.provider';
import { Client } from '@opensearch-project/opensearch';
import {TermsAggregation} from "@opensearch-project/opensearch/api/_types/_common.aggregations";

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

  private getTotalHits(total: any): number {
    if (!total) {
      return 0;
    }
    if (typeof total === 'number') {
      return total;
    }
    return total.value;
  }

  async findResults(
      id: number,
      size: number = 10,
      after_key?: string
  ) {
    const segment: Segment | null = await this.findOne(id);
    if (!segment) {
      throw new Error('Segment not found');
    }

    const index = 'users-logs-' + segment.get('client');
    const queryBody = segment.get('query');

    const aggregationBody = {
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
      aggregationBody.aggs.ids.composite['after'] = JSON.parse(atob(after_key));
    }

    const response = await this.osClient.search({
      index,
      body: aggregationBody,
    });

    const aggregationResults: TermsAggregation = response.body.aggregations!.ids;
    const ids = aggregationResults.buckets.map((bucket: any) => bucket.key.id);

    return {
      segment_id: id,
      total: aggregationResults.buckets.length, // Il conteggio è solo per la pagina corrente
      ids: ids,
      after_key: aggregationResults.after_key ? btoa(JSON.stringify(aggregationResults.after_key)) : undefined,
    };
  }
}
