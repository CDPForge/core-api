import { RequestHandler } from 'express';
import { esClient, getIndexPattern, buildBaseQuery } from '../utils/elasticHelper';
import { SearchResponse } from '@elastic/elasticsearch/lib/api/types';

export const getVisitors: RequestHandler = async (req, res) => {
  const clientId = req.user.currentClientId;

  try {
    const response: SearchResponse<any, any> = await esClient.search({
      index: getIndexPattern(clientId),
      body: {
        query: buildBaseQuery({ clientId, action: 'view', from: 'now-15m', to: 'now' }),
        size: 0,
        aggs: {
          unique_visitors: {
            cardinality: {
              field: 'deviceId'
            }
          }
        }
      }
    });

    res.json({
      success: true,
      data: {
        visitors: response.aggregations?.unique_visitors?.value || 0
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
        query: buildBaseQuery({ clientId, action: 'view', from: 'now-3h', to: 'now' }),
        size: 0,
        aggs: {
            last10m: {
              date_histogram: {
                field: 'date',
                fixed_interval: '10m',
                format: 'yyyy-MM-dd HH:mm'
              },
              aggs: {
                unique_visitors: {
                  cardinality: {
                    field: 'deviceId'
                  }
                }
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
          visitors: bucket.unique_visitors.value
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
              { term: { action: 'view' } },
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
          group_by: {
            terms: {
              field: field,
              size: 100
            },
            aggs: {
              unique_visitors: {
                cardinality: {
                  field: 'deviceId'
                }
              }
            }
          }
        }
      }
    });

    res.json({
      success: true,
      data: (response.aggregations?.group_by as { buckets: any[] })?.buckets?.map((bucket) => ({
        key: bucket.key,
        visitors: bucket.unique_visitors.value
      })) || []
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Errore nel recupero delle statistiche in tempo reale'
    });
  }
};
