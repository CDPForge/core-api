import { RequestHandler } from 'express';
import { esClient, getIndexPattern, buildBaseQuery, esMapping, buildGroupByQuery } from '../utils/elasticHelper';
import { AggregationsAggregationContainer, SearchResponse } from '@elastic/elasticsearch/lib/api/types';

const uniqueDevicesAgg: AggregationsAggregationContainer = {
  nested: {
    path: esMapping.DEVICE.PATH
  },
  aggs: {
    unique_devices: {
      cardinality: {
        field: esMapping.DEVICE.ID
      }
    }
  }
};

export const getTotalUViews: RequestHandler = async (req, res) => {
  const { from, to } = req.query;
  const clientId = req.user.currentClientId;

  if (!from || !to) {
    res.status(400).json({
      success: false,
      message: 'Parametri from e to richiesti'
    });
    return;
  }

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
            nested_device: uniqueDevicesAgg
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
            nested_device: uniqueDevicesAgg
          }
        }
      }
    });

    res.json({
      success: true,
      data: {
        current_unique_views: response.aggregations?.current_views?.nested_device?.unique_devices?.value || 0,
        previous_unique_views: response.aggregations?.previous_views?.nested_device?.unique_devices?.value || 0
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Errore nel recupero delle statistiche'
    });
  }
};

export const createGetUViewsByGroup = (field: string): RequestHandler => async (req, res) => {
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
          group_by: buildGroupByQuery(field, uniqueDevicesAgg, "nested_device")
        }
      }
    });
 
    res.json({
      success: true,
      data: (response.aggregations?.group_by?.inner_group_by ?? response.aggregations?.group_by)?.buckets?.map((bucket: any) => ({
        key: bucket.key,
        count: bucket.nested_device.unique_devices.value
      })) || []
    });
  } catch (error) {
    console.error('Errore nel recupero delle statistiche:', error);
    res.status(500).json({
      success: false,
      message: 'Errore nel recupero delle statistiche'
    });
  }
};

export const getDailyUViews: RequestHandler = async (req, res) => {
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
          daily: {
            date_histogram: {
              field: esMapping.DATE,
              calendar_interval: 'day',
              format: 'yyyy-MM-dd'
            },
            aggs: {
              nested_device: uniqueDevicesAgg
            }
          }
        }
      }
    });

    res.json({
      success: true,
      data: (response.aggregations?.daily as { buckets: any[] })?.buckets?.map((bucket) => ({
        date: bucket.key_as_string,
        count: bucket.nested_device?.unique_devices?.value
      })) || []
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Errore nel recupero delle statistiche'
    });
  }
};

export const getNewReturning: RequestHandler = async (req, res) => {
  const { from, to } = req.query;
  const clientId = req.user.currentClientId;

  if (!from || !to) {
    res.status(400).json({
      success: false,
      message: 'I parametri from e to sono obbligatori'
    });
    return;
  }

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
      size: 0,
      query: buildBaseQuery({ clientId, from: prevFrom as string, to: to as string, event: 'view' }),
      aggs: {
        new_users: {
          filter: {
            bool: {
              must: [
                {
                  range: {
                    [esMapping.DATE]: {
                      gte: from,
                      lte: to
                    }
                  }
                }
              ],
              must_not: [
                {
                  range: {
                    [esMapping.DATE]: {
                      lt: from
                    }
                  }
                }
              ]
            }
          },
          aggs: {
            nested_device: uniqueDevicesAgg
          }
        },
        returning_users: {
          filter: {
            bool: {
              must: [
                {
                  range: {
                    [esMapping.DATE]: {
                      gte: from,
                      lte: to
                    }
                  }
                },
                {
                  range: {
                    [esMapping.DATE]: {
                      lt: from
                    }
                  }
                }
              ]
            }
          },
          aggs: {
            nested_device: uniqueDevicesAgg
          }
        },
        prev_new_users: {
          filter: {
            bool: {
              must: [
                {
                  range: {
                    [esMapping.DATE]: {
                      gte: prevFrom,
                      lte: prevTo
                    }
                  }
                }
              ],
              must_not: [
                {
                  range: {
                    [esMapping.DATE]: {
                      lt: prevFrom
                    }
                  }
                }
              ]
            }
          },
          aggs: {
            nested_device: uniqueDevicesAgg
          }
        },
        prev_returning_users: {
          filter: {
            bool: {
              must: [
                {
                  range: {
                    [esMapping.DATE]: {
                      gte: prevFrom,
                      lte: prevTo
                    }
                  }
                },
                {
                  range: {
                    [esMapping.DATE]: {
                      lt: prevFrom
                    }
                  }
                }
              ]
            }
          },
          aggs: {
            nested_device: uniqueDevicesAgg
          }
        }
      }
    });

    res.json({
      success: true,
      data: {
        newUsers: response.aggregations?.new_users?.nested_device?.unique_devices?.value || 0,
        returningUsers: response.aggregations?.returning_users?.nested_device?.unique_devices?.value || 0,
        prevNewUsers: response.aggregations?.prev_new_users?.nested_device?.unique_devices?.value || 0,
        prevReturningUsers: response.aggregations?.prev_returning_users?.nested_device?.unique_devices?.value || 0
      }
    });
  } catch (error) {
    console.error('Elasticsearch error:', error);
    res.status(500).json({
      success: false,
      message: 'Errore nel recupero delle statistiche'
    });
  }
};

