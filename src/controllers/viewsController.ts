import { RequestHandler } from 'express';
import { esClient, getIndexPattern, buildBaseQuery, esMapping, buildGroupByQuery } from '../utils/elasticHelper';
import { SearchResponse } from '@elastic/elasticsearch/lib/api/types';

export const getTotalViews: RequestHandler = async (req, res) => {
  const { from, to } = req.query;
  const clientId = req.user.currentClientId;

  if (!from || !to) {
    res.status(400).json({
      success: false,
      message: 'Parametri from e to richiesti'
    });
    return;
  }

  // Calcola il periodo corrente e precedente
  const fromDate = from ? new Date(from as string) : new Date();
  const toDate = to ? new Date(to as string) : new Date();
  const diffDays = Math.ceil((toDate.getTime() - fromDate.getTime()) / (1000 * 60 * 60 * 24));

  const prevFromDate = new Date(fromDate);
  prevFromDate.setDate(prevFromDate.getDate() - diffDays);
  const prevToDate = new Date(toDate);
  prevToDate.setDate(prevToDate.getDate() - diffDays);

  const prevFrom = prevFromDate.toISOString();
  const prevTo = prevToDate.toISOString();

  try {
    const response: SearchResponse<any, any> = await esClient.search({
      index: getIndexPattern(clientId),
      body: {
        query: buildBaseQuery({ clientId, from: prevFrom as string, to: to as string, event: 'view' }),
        size: 0
      },
      aggs: {
        current_views: {
          filter: {
            range: {
              [esMapping.DATE]: {
                gte: from,
                lte: to
              }
            }
          },
          aggs: {
            total_views: {
              value_count: {
                field: esMapping.DATE
              }
            }
          }
        },
        previous_views: {
          filter: {
            range: {
              [esMapping.DATE]: {
                gte: prevFrom,
                lte: prevTo
              }
            }
          },
          aggs: {
            total_views: {
              value_count: {
                field: esMapping.DATE
              }
            }
          }
        }
      }
    });

    res.json({
      success: true,
      data: {
        current_views: response.aggregations?.current_views?.total_views?.value || 0,
        previous_views: response.aggregations?.previous_views?.total_views?.value || 0
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Errore nel recupero delle statistiche'
    });
  }
};

export const createGetViewsByGroup = (field: string): RequestHandler => async (req, res) => {
  const { from, to } = req.query;
  const clientId = req.user.currentClientId;

  if (!from || !to) {
    res.status(400).json({
      success: false,
      message: 'Parametri from e to richiesti'
    });
  }

  try {
    const response: SearchResponse<any, any> = await esClient.search({
      index: getIndexPattern(clientId),
      body: {
        query: buildBaseQuery({ clientId, from: from as string, to: to as string, event: 'view' }),
        size: 0,
        aggs: {
          group_by: buildGroupByQuery(field)
        }
      }
    });

    res.json({
      success: true,
      data: (response.aggregations?.group_by?.inner_group_by ?? response.aggregations?.group_by)?.buckets?.map((bucket: any) => ({
        key: bucket.key,
        count: bucket.doc_count
      })) || []
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Errore nel recupero delle statistiche'
    });
  }
};

export const getDailyViews: RequestHandler = async (req, res) => {
  const { from, to } = req.query;
  const clientId = req.user.currentClientId;

  if (!from || !to) {
    res.status(400).json({
      success: false,
      message: 'Parametri from e to richiesti'
    });
    return;
  }
    try {
      const response: SearchResponse<any, any> = await esClient.search({
        index: getIndexPattern(clientId),
        body: {
          query: buildBaseQuery({ clientId, from: from as string, to: to as string, event: 'view' }),
          size: 0,
          aggs: {
            daily: {
              date_histogram: {
                field: esMapping.DATE,
                calendar_interval: 'day',
                format: 'yyyy-MM-dd'
              }
            }
          }
        }
      });

      res.json({
        success: true,
        data: (response.aggregations?.daily as { buckets: any[] })?.buckets?.map((bucket) => ({
          date: bucket.key_as_string,
          count: bucket.doc_count
        })) || []
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Errore nel recupero delle statistiche'
      });
    }
  };
