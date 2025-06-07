import { RequestHandler } from 'express';
import { esClient, getIndexPattern, buildBaseQuery, esMapping } from '../utils/elasticHelper';
import { SearchResponse } from '@elastic/elasticsearch/lib/api/types';

export const getTotalClicks: RequestHandler = async (req, res) => {
  const { from, to } = req.query;
  const clientId = req.user.currentClientId;

  if (!from || !to) {
    res.status(400).json({
      success: false,
      message: 'Parametri from e to richiesti'
    });
    return;
  }

  const fromDate = new Date(from as string);
  const toDate = new Date(to as string);
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
        query: buildBaseQuery({ clientId, from: prevFrom as string, to: to as string, event: 'click' }),
        size: 0,
        aggs: {
          current_clicks: {
            filter: {
              range: {
                [esMapping.DATE]: {
                  gte: from,
                  lte: to
                }
              }
            },
            aggs: {
              total_clicks: {
                value_count: {
                  field: esMapping.DATE
                }
              }
            }
          },
          previous_clicks: {
            filter: {
              range: {
                [esMapping.DATE]: {
                  gte: prevFrom,
                  lte: prevTo
                }
              }
            },
            aggs: {
              total_clicks: {
                value_count: {
                  field: esMapping.DATE
                }
              }
            }
          }
        }
      }
    });
    
    res.json({
      success: true,
      data: {
        current_clicks: response.aggregations?.current_clicks?.total_clicks?.value || 0,
        previous_clicks: response.aggregations?.previous_clicks?.total_clicks?.value || 0
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Errore nel recupero delle statistiche'
    });
  }
};

export const getClicksByTarget: RequestHandler = async (req, res) => {
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
        query: buildBaseQuery({ clientId, from: from as string, to: to as string, event: 'click' }),
        size: 0,
        aggs: {
          group_by: {
            terms: {
              field: esMapping.TARGET,
              size: 100
            }
          }
        }
      }
    });

    res.json({
      success: true,
      data: (response.aggregations?.group_by as { buckets: any[] })?.buckets?.map((bucket) => ({
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

export const getDailyClicks: RequestHandler = async (req, res) => {
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
        query: buildBaseQuery({ clientId, from: from as string, to: to as string, event: 'click' }),
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
      data: response.aggregations?.daily?.buckets?.map((bucket:any ) => ({
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
