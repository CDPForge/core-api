import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Segment } from './entities/segment.entity';
import { CreateSegmentDto } from './dto/create-segment.dto';
import { UpdateSegmentDto } from './dto/update-segment.dto';
import { OpensearchProvider } from '../opensearch/opensearch.provider';
import { Client } from '@opensearch-project/opensearch';

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

  async findResults(id: number, size: number = 10, scroll_id?: string) {
    const segment = await this.findOne(id);
    if (!segment) {
      throw new Error('Segment not found');
    }

    // TODO: The index should be dynamic, based on the client or instance
    const index = 'users-logs-' + segment.get('client');
    if (scroll_id) {
      const response = await this.osClient.scroll({
        scroll_id,
        scroll: '1m', // keep the scroll window open for another minute
      });

      return {
        segment_id: id,
        total: this.getTotalHits(response.body.hits.total),
        ids: response.body.hits.hits.map((hit) => hit._id),
        scroll_id: response.body._scroll_id,
      };
    } else {
      const response = await this.osClient.search({
        index,
        scroll: '1m', // keep the scroll window open for a minute
        size,
        body: {
          query: segment.get('query'),
          _source: false, // we only need the IDs
        },
      });

      return {
        segment_id: id,
        total: this.getTotalHits(response.body.hits.total),
        ids: response.body.hits.hits.map((hit) => hit._id),
        scroll_id: response.body._scroll_id,
      };
    }
  }
}
