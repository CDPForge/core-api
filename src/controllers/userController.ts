import { Request, Response, RequestHandler } from 'express';
import { Client } from '@elastic/elasticsearch';
import { SearchResponse } from '@elastic/elasticsearch/lib/api/types';

const esClient = new Client({ 
  node: process.env.ELASTICSEARCH_URL || 'http://localhost:9200' 
});

export const getDailyPageViews: RequestHandler = async (req: Request, res: Response) => {
  const { from, to } = req.query;
  const clientId = req.user.currentClientId;

  if (!from || !to) {
    res.status(400).json({
      success: false,
      message: 'I parametri from e to sono obbligatori'
    });
    return;
  }

  try {
    const response: SearchResponse<any, any> = await esClient.search({
      index: `users-logs-${clientId}`,
      size: 0,
      query: {
        bool: {
          must: [
            { term: { action: 'view' } },
            {
              range: {
                date: {
                  gte: from,
                  lte: to
                }
              }
            }
          ]
        }
      },
      aggs: {
        daily_views: {
          date_histogram: {
            field: 'date',
            calendar_interval: 'day',
            format: 'yyy-MM-dd\'T\'HH:mm:ssZZ'
          },
          aggs: {
            unique_devices: {
              cardinality: {
                field: 'deviceId'
              }
            }
          }
        }
      }
    });

    const dailyStats = response.aggregations?.daily_views?.buckets?.map((bucket: any) => ({
      date: bucket.key_as_string,
      totalViews: bucket.doc_count,
      uniqueDevices: bucket.unique_devices.value
    })) || [];

    res.json({
      success: true,
      data: dailyStats
    });
  } catch (error) {
    console.error('Elasticsearch error:', error);
    res.status(500).json({
      success: false,
      message: 'Errore nel recupero delle statistiche'
    });
  }
};

export const getPageViews: RequestHandler = async (req: Request, res: Response) => {
  const { from, to } = req.query;
  const clientId = req.user.currentClientId;

  if (!from || !to) {
    res.status(400).json({
      success: false,
      message: 'I parametri from e to sono obbligatori'
    });
    return;
  }

  try {
    const response: SearchResponse<any, any> = await esClient.search({
      index: `users-logs-${clientId}`,
      size: 0,
      query: {
        bool: {
          must: [
            { term: { action: 'view' } },
            {
              range: {
                date: {
                  gte: from,
                  lte: to
                }
              }
            }
          ]
        }
      },
      aggs: {
        total_views: {
          value_count: {
            field: 'date'
          }
        },
        unique_devices: {
          cardinality: {
            field: 'deviceId'
          }
        }
      }
    });

    res.json({
      success: true,
      data: {
        totalViews: response.aggregations?.total_views?.value || 0,
        uniqueDevices: response.aggregations?.unique_devices?.value || 0
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

export const getNewUsers: RequestHandler = async (req: Request, res: Response) => {
  const { from, to } = req.query;
  const clientId = req.user.currentClientId;

  if (!from || !to) {
    res.status(400).json({
      success: false,
      message: 'I parametri from e to sono obbligatori'
    });
    return;
  }

  try {
    const response: SearchResponse<any, any> = await esClient.search({
      index: `users-logs-${clientId}`,
      size: 0,
      query: {
        bool: {
          must: [
            { term: { action: 'view' } }
          ]
        }
      },
      aggs: {
        new_users: {
          filter: {
            bool: {
              must: [
                {
                  range: {
                    date: {
                      gte: from,
                      lte: to
                    }
                  }
                }
              ],
              must_not: [
                {
                  range: {
                    date: {
                      lt: from
                    }
                  }
                }
              ]
            }
          },
          aggs: {
            unique_new_users: {
              cardinality: {
                field: 'deviceId'
              }
            }
          }
        },
        returning_users: {
          filter: {
            bool: {
              must: [
                {
                  range: {
                    date: {
                      gte: from,
                      lte: to
                    }
                  }
                },
                {
                  range: {
                    date: {
                      lt: from
                    }
                  }
                }
              ]
            }
          },
          aggs: {
            unique_returning_users: {
              cardinality: {
                field: 'deviceId'
              }
            }
          }
        }
      }
    });

    res.json({
      success: true,
      data: {
        newUsers: response.aggregations?.new_users?.unique_new_users?.value || 0,
        returningUsers: response.aggregations?.returning_users?.unique_returning_users?.value || 0
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