import { RequestHandler } from 'express';
import { 
  getDailyPageViews, 
  getPageViews, 
  getNewUsers,
  getDeviceStats,
  getProductAnalytics,
  getTrafficSources,
  getUserInterests,
  getDailyPriceAnalytics 
} from '../controllers/logsController';

interface EndpointConfig {
  path: string;
  method: 'get' | 'post' | 'put' | 'delete';
  handler: RequestHandler;
  supportsBulk: boolean;
}

export const endpoints: Record<string, EndpointConfig> = {
  'daily-views': {
    path: '/api/logs/daily-views',
    method: 'get',
    handler: getDailyPageViews,
    supportsBulk: true
  },
  'views': {
    path: '/api/logs/views',
    method: 'get',
    handler: getPageViews,
    supportsBulk: true
  },
  'new-users': {
    path: '/api/logs/new-users',
    method: 'get',
    handler: getNewUsers,
    supportsBulk: true
  },
  'device-stats': {
    path: '/api/logs/devices',
    method: 'get',
    handler: getDeviceStats,
    supportsBulk: true
  },
  'product-analytics': {
    path: '/api/logs/products',
    method: 'get',
    handler: getProductAnalytics,
    supportsBulk: true
  },
  'daily-price': {
    path: '/api/logs/products/daily-price',
    method: 'get',
    handler: getDailyPriceAnalytics,
    supportsBulk: true
  },
  'traffic-sources': {
    path: '/api/logs/traffic',
    method: 'get',
    handler: getTrafficSources,
    supportsBulk: true
  },
  'user-interests': {
    path: '/api/logs/interests',
    method: 'get',
    handler: getUserInterests,
    supportsBulk: true
  }
};

// Helper per il bulk controller
export const bulkEndpointMap = Object.entries(endpoints)
  .filter(([_, config]) => config.supportsBulk)
  .reduce((acc, [key, config]) => ({
    ...acc,
    [key]: config.handler
  }), {} as Record<string, RequestHandler>); 