import { RequestHandler } from 'express';
import { esClient, getIndexPattern, buildBaseQuery, esMapping, buildGroupByQuery } from '../utils/elasticHelper';
import { SearchResponse } from '@elastic/elasticsearch/lib/api/types';

const visitorsAgg = {
  nested: {
    path: esMapping.DEVICE.PATH
  },
  aggs: {
    unique_visitors: {
      cardinality: {
        field: esMapping.DEVICE.ID
      }
    }
  }
}

export const getVisitors: RequestHandler = async (req, res) => {
  const clientId = req.user.currentClientId;

  try {
    const response: SearchResponse<any, any> = await esClient.search({
      index: getIndexPattern(clientId),
      body: {
        query: buildBaseQuery({ clientId, event: 'view', from: 'now-15m', to: 'now' }),
        size: 0,
        aggs: {
          nested_device: visitorsAgg
        }
      }
    });

    res.json({
      success: true,
      data: {
        visitors: response.aggregations?.nested_device?.unique_visitors?.value || 0
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Errore nel recupero delle statistiche in tempo reale'
    });
  }
};

export const getVisitorsLast3Hours: RequestHandler = async (req, res) => {
  const clientId = req.user.currentClientId;

  try {
    const response: SearchResponse<any, any> = await esClient.search({
      index: getIndexPattern(clientId),
      body: {
        query: buildBaseQuery({ clientId, event: 'view', from: 'now-3h', to: 'now' }),
        size: 0,
        aggs: {
            last10m: {
              date_histogram: {
                field: 'date',
                fixed_interval: '10m',
                format: 'yyyy-MM-dd HH:mm'
              },
              aggs: {
                nested_device: visitorsAgg
              }
            },
        }
      }
    });

    res.json({
      success: true,
      data: {
        visitors: response.aggregations?.last10m?.buckets?.map((bucket: any) => ({
          date: bucket.key_as_string,
          visitors: bucket.nested_device?.unique_visitors?.value
        })) || []
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Errore nel recupero delle statistiche in tempo reale'
    });
  }
};

export const createGetVisitorsByGroup = (field: string): RequestHandler => async (req, res) => {
  const clientId = req.user.currentClientId;

  try {
    const response: SearchResponse<any, any> = await esClient.search({
      index: getIndexPattern(clientId),
      body: {
        query: {
          bool: {
            must: [
              { term: { event: 'view' } },
              {
                range: {
                  date: {
                    gte: 'now-15m'
                  }
                }
              }
            ]
          }
        },
        size: 0,
        aggs: {
          group_by: buildGroupByQuery(field, visitorsAgg, "nested_device")
        }
      }
    });

    res.json({
      success: true,
      data:(response.aggregations?.group_by?.inner_group_by ?? response.aggregations?.group_by)?.buckets?.map((bucket: any) => ({
        key: bucket.key,
        visitors: bucket.nested_device?.unique_visitors?.value
      })) || []
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Errore nel recupero delle statistiche in tempo reale'
    });
  }
};
