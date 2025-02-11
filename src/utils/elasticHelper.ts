import { Client } from '@elastic/elasticsearch';
import { QueryDslQueryContainer } from '@elastic/elasticsearch/lib/api/types';

export const esClient = new Client({ 
  node: process.env.ELASTICSEARCH_URL || 'http://localhost:9200' 
});

export const getIndexPattern = (clientId: number) => `users-logs-${clientId}`;

export interface ESQueryParams {
  from?: string;
  to?: string;
  clientId: number;
  field?: string;
  interval?: string;
  action?: string;
}

export const buildBaseQuery = (params: ESQueryParams): QueryDslQueryContainer => ({
  bool: {
    must: [
      params.action && { term: { action: params.action } },
      params.from && params.to && {
        range: {
          date: {
            gte: params.from,
            lte: params.to
          }
        }
      }
    ].filter(Boolean) as QueryDslQueryContainer[]
  }
}); 