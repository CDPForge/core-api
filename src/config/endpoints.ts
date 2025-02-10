import { RequestHandler } from 'express';
import { getDailyPageViews, getPageViews, getNewUsers } from '../controllers/userController';

interface EndpointConfig {
  path: string;
  method: 'get' | 'post' | 'put' | 'delete';
  handler: RequestHandler;
  supportsBulk: boolean;
}

export const endpoints: Record<string, EndpointConfig> = {
  'daily-views': {
    path: '/api/users/daily-views',
    method: 'get',
    handler: getDailyPageViews,
    supportsBulk: true
  },
  'views': {
    path: '/api/users/views',
    method: 'get',
    handler: getPageViews,
    supportsBulk: true
  },
  'new-users': {
    path: '/api/users/new-users',
    method: 'get',
    handler: getNewUsers,
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