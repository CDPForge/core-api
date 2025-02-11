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

export const getDeviceStats: RequestHandler = async (req: Request, res: Response) => {
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
        range: {
          date: {
            gte: from,
            lte: to
          }
        }
      },
      aggs: {
        os_stats: {
          terms: {
            field: 'os',
            size: 10
          }
        },
        browser_stats: {
          terms: {
            field: 'browser',
            size: 10
          }
        },
        mobile_ratio: {
          terms: {
            field: 'deviceType',
            size: 10
          }
        }
      }
    });

    res.json({
      success: true,
      data: {
        operatingSystems: response.aggregations?.os_stats?.buckets || [],
        browsers: response.aggregations?.browser_stats?.buckets || [],
        mobileUsage: response.aggregations?.mobile_ratio?.buckets || []
      }
    });
  } catch (error) {
    console.error('Elasticsearch error:', error);
    res.status(500).json({
      success: false,
      message: 'Errore nel recupero delle statistiche dei dispositivi'
    });
  }
};

export const getProductAnalytics: RequestHandler = async (req: Request, res: Response) => {
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
        range: {
          date: {
            gte: from,
            lte: to
          }
        }
      },
      aggs: {
        categories: {
          terms: {
            field: 'category',
            size: 20
          }
        },
        brands: {
          terms: {
            field: 'brand',
            size: 20
          }
        },
        price_percentiles: {
          percentiles: {
            field: 'price',
            percents: [1, 5, 25, 50, 75, 95, 99]
          }
        },
        price_histogram: {
          histogram: {
            field: 'price',
            interval: 50,  // Intervallo di 50€
            min_doc_count: 1
          }
        },
        price_stats: {
          extended_stats: {  // Include deviazione standard e altri valori statistici
            field: 'price'
          }
        }
      }
    });

    res.json({
      success: true,
      data: {
        categories: response.aggregations?.categories?.buckets || [],
        brands: response.aggregations?.brands?.buckets || [],
        priceDistribution: {
          percentiles: response.aggregations?.price_percentiles?.values || {},
          histogram: response.aggregations?.price_histogram?.buckets || [],
          stats: {
            min: response.aggregations?.price_stats?.min || 0,
            max: response.aggregations?.price_stats?.max || 0,
            stdDeviation: response.aggregations?.price_stats?.std_deviation || 0,
            variance: response.aggregations?.price_stats?.variance || 0
          }
        }
      }
    });
  } catch (error) {
    console.error('Elasticsearch error:', error);
    res.status(500).json({
      success: false,
      message: 'Errore nel recupero delle statistiche dei prodotti'
    });
  }
};

export const getTrafficSources: RequestHandler = async (req: Request, res: Response) => {
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
        range: {
          date: {
            gte: from,
            lte: to
          }
        }
      },
      aggs: {
        referrers: {
          terms: {
            field: 'referrer',
            size: 20
          }
        },
        geo_locations: {
          terms: {
            field: 'Geo',
            size: 20
          }
        }
      }
    });

    res.json({
      success: true,
      data: {
        referrers: response.aggregations?.referrers?.buckets || [],
        popularTopics: response.aggregations?.topics?.buckets || [],
        geoLocations: response.aggregations?.geo_locations?.buckets || []
      }
    });
  } catch (error) {
    console.error('Elasticsearch error:', error);
    res.status(500).json({
      success: false,
      message: 'Errore nel recupero delle statistiche delle fonti di traffico'
    });
  }
};

export const getUserInterests: RequestHandler = async (req: Request, res: Response) => {
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
        range: {
          date: {
            gte: from,
            lte: to
          }
        }
      },
      aggs: {
        all_topics: {
          terms: {
            field: 'topics',
            size: 20,
            order: { "_count": "desc" }
          },
          aggs: {
            daily_trend: {
              date_histogram: {
                field: 'date',
                calendar_interval: 'day'
              }
            },
            unique_users: {
              cardinality: {
                field: 'deviceId'
              }
            },
            related_topics: {
              significant_terms: {
                field: 'topics',
                exclude: [] // Esclude il topic corrente
              }
            }
          }
        },
        topics_by_device_type: {
          terms: {
            field: 'deviceType',
            size: 3
          },
          aggs: {
            top_topics: {
              terms: {
                field: 'topics',
                size: 10
              }
            }
          }
        }
      }
    });

    const topicsData = response.aggregations?.all_topics?.buckets?.map((topic: any) => ({
      topic: topic.key,
      count: topic.doc_count,
      uniqueUsers: topic.unique_users.value,
      dailyTrend: topic.daily_trend.buckets,
      relatedTopics: topic.related_topics.buckets?.map((related: any) => ({
        topic: related.key,
        significance: related.score
      }))
    })) || [];

    const deviceTypeBreakdown = response.aggregations?.topics_by_device_type?.buckets?.map((device: any) => ({
      deviceType: device.key,
      topTopics: device.top_topics.buckets
    })) || [];

    res.json({
      success: true,
      data: {
        topics: topicsData,
        deviceTypeBreakdown
      }
    });
  } catch (error) {
    console.error('Elasticsearch error:', error);
    res.status(500).json({
      success: false,
      message: 'Errore nel recupero delle statistiche degli interessi'
    });
  }
};

export const getDailyPriceAnalytics: RequestHandler = async (req: Request, res: Response) => {
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
            {
              range: {
                date: {
                  gte: from,
                  lte: to
                }
              }
            },
            {
              exists: {
                field: 'price'
              }
            }
          ]
        }
      },
      aggs: {
        daily_stats: {
          date_histogram: {
            field: 'date',
            calendar_interval: 'day'
          },
          aggs: {
            daily_revenue: {
              sum: {
                field: 'price',
                script: {
                  source: "_value * doc['quantity'].value"
                }
              }
            },
            avg_order_value: {
              avg: {
                field: 'price'
              }
            },
            price_percentiles: {
              percentiles: {
                field: 'price',
                percents: [25, 50, 75]
              }
            },
            price_distribution: {
              histogram: {
                field: 'price',
                interval: 50
              }
            },
            categories_revenue: {
              terms: {
                field: 'category',
                size: 5
              },
              aggs: {
                revenue: {
                  sum: {
                    field: 'price',
                    script: {
                      source: "_value * doc['quantity'].value"
                    }
                  }
                }
              }
            }
          }
        },
        total_revenue: {
          sum: {
            field: 'price',
            script: {
              source: "_value * doc['quantity'].value"
            }
          }
        },
        orders_count: {
          value_count: {
            field: 'price'
          }
        }
      }
    });

    const dailyStats = response.aggregations?.daily_stats?.buckets?.map((day: any) => ({
      date: day.key_as_string,
      revenue: day.daily_revenue.value,
      averageOrderValue: day.avg_order_value.value,
      pricePercentiles: {
        p25: day.price_percentiles.values['25.0'],
        median: day.price_percentiles.values['50.0'],
        p75: day.price_percentiles.values['75.0']
      },
      priceDistribution: day.price_distribution.buckets,
      topCategories: day.categories_revenue.buckets.map((cat: any) => ({
        category: cat.key,
        revenue: cat.revenue.value
      }))
    })) || [];

    res.json({
      success: true,
      data: {
        dailyStats,
        summary: {
          totalRevenue: response.aggregations?.total_revenue?.value || 0,
          totalOrders: response.aggregations?.orders_count?.value || 0,
          averageOrderValue: (response.aggregations?.total_revenue?.value || 0) / 
                           (response.aggregations?.orders_count?.value || 1)
        }
      }
    });
  } catch (error) {
    console.error('Elasticsearch error:', error);
    res.status(500).json({
      success: false,
      message: 'Errore nel recupero delle statistiche giornaliere dei prezzi'
    });
  }
}; 