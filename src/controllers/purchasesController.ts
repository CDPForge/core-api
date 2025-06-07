import { RequestHandler } from 'express';
import { esClient, getIndexPattern, buildBaseQuery, esMapping, buildGroupByQuery } from '../utils/elasticHelper';
import { SearchResponse } from '@elastic/elasticsearch/lib/api/types';


//TODO: Adding info about orderid if present
const totalRevenueAgg = {
  nested: {
    path: esMapping.PRODUCT.PATH
  },
  aggs: {
    total_revenue: {
      sum: {
        script: {
          source: "doc['" + esMapping.PRODUCT.PRICE + "'].value * doc['" + esMapping.PRODUCT.QUANTITY + "'].value"
        }
      }
    }
  }
}

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
        query: buildBaseQuery({ clientId, from: prevFrom as string, to: to as string, event: 'purchase' }),
        size: 0,
        aggs: {
          current_purchases: {
            filter: {
              range: {
                [esMapping.DATE]: {
                  gte: from,
                  lte: to
                }
              }
            },
            aggs: {
              total_purchases: {
                value_count: {
                  field: esMapping.DATE
                }
              },
              nested_products: totalRevenueAgg
            }
          },
          previous_purchases: {
            filter: {
              range: {
                [esMapping.DATE]: {
                  gte: prevFrom,
                  lte: prevTo
                }
              }
            },
            aggs: {
              total_purchases: {
                value_count: {
                  field: esMapping.DATE
                }
              },
              nested_products: totalRevenueAgg
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
        current_revenue: response.aggregations?.current_purchases?.nested_products?.total_revenue?.value || 0,
        previous_revenue: response.aggregations?.previous_purchases?.nested_products?.total_revenue?.value || 0
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
        query: buildBaseQuery({ clientId, from: from as string, to: to as string, event: 'purchase' }),
        size: 0,
        aggs: {
          group_by: buildGroupByQuery(field, totalRevenueAgg, "nested_products")
        }
      }
    });

    let data = (response.aggregations?.group_by?.inner_group_by ?? response.aggregations?.group_by)?.buckets?.map((bucket: any) => ({
      key: bucket.key,
      count: bucket.doc_count,
      revenue: bucket.nested_products?.total_revenue?.value || 0
    })) || [];
    

    res.json({
      success: true,
      data: data
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
        query: buildBaseQuery({ clientId, from: from as string, to: to as string, event: 'purchase' }),
        size: 0,
        aggs: {
          daily: {
            date_histogram: {
              field: esMapping.DATE,
              calendar_interval: 'day',
              format: 'yyyy-MM-dd'
            },
            aggs: {
              nested_products: totalRevenueAgg
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
        revenue: bucket.nested_products?.total_revenue?.value || 0
      })) || []
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Errore nel recupero delle statistiche'
    });
  }
};
