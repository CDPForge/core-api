import { RequestHandler } from 'express';
import { esClient, getIndexPattern, buildBaseQuery } from '../utils/elasticHelper';
import { SearchResponse } from '@elastic/elasticsearch/lib/api/types';

export const getTotalPurchases: RequestHandler = async (req, res) => {
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
        query: buildBaseQuery({ clientId, from: prevFrom as string, to: prevTo as string, action: 'purchase' }),
        size: 0,
        aggs: {
          current_purchases: {
            filter: {
              range: {
                date: {
                  gte: from,
                  lte: to
                }
              }
            },
            aggs: {
              total_purchases: {
                value_count: {
                  field: 'date'
                }
              },
              totale_revenue: {
                sum: {
                  script: {
                    source: "doc['productPrice'].value * doc['productQuantity'].value"
                  }
                }
              }
            }
          },
          previous_purchases: {
            filter: {
              range: {
                date: {
                  gte: prevFrom,
                  lte: prevTo
                }
              }
            },
            aggs: {
              total_purchases: {
                value_count: {
                  field: 'date'
                }
              },
              totale_revenue: {
                sum: {
                  script: {
                    source: "doc['productPrice'].value * doc['productQuantity'].value"
                  }
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
        current_purchases: response.aggregations?.current_purchases?.total_purchases?.value || 0,
        previous_purchases: response.aggregations?.previous_purchases?.total_purchases?.value || 0,
        current_revenue: response.aggregations?.current_purchases?.totale_revenue?.value || 0,
        previous_revenue: response.aggregations?.previous_purchases?.totale_revenue?.value || 0
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Errore nel recupero delle statistiche'
    });
  }
};

export const createGetPurchasesByGroup = (field: string): RequestHandler => async (req, res) => {
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
        query: buildBaseQuery({ clientId, from: from as string, to: to as string, action: 'purchase' }),
        size: 0,
        aggs: {
          group_by: {
            terms: {
              field: field,
              size: 100
            },
            aggs: {
              totale_revenue: {
                sum: {
                  script: {
                    source: "doc['productPrice'].value * doc['productQuantity'].value"
                  }
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
        count: bucket.doc_count,
        revenue: bucket.totale_revenue?.value || 0
      })) || []
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Errore nel recupero delle statistiche'
    });
  }
};

export const getDailyPurchases: RequestHandler = async (req, res) => {
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
        query: buildBaseQuery({ clientId, from: from as string, to: to as string, action: 'purchase' }),
        size: 0,
        aggs: {
          daily: {
            date_histogram: {
              field: 'date',
              calendar_interval: 'day',
              format: 'yyyy-MM-dd'
            },
            aggs: {
              totale_revenue: {
                sum: {
                  script: {
                    source: "doc['productPrice'].value * doc['productQuantity'].value"
                  }
                }
              }
            }
          }
        }
      }
    });

    res.json({
      success: true,
      data: (response.aggregations?.daily as { buckets: any[] })?.buckets?.map((bucket) => ({
        date: bucket.key_as_string,
        count: bucket.doc_count,
        revenue: bucket.totale_revenue?.value || 0
      })) || []
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Errore nel recupero delle statistiche'
    });
  }
};
