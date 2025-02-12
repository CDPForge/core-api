import { RequestHandler } from 'express';
import views from './views';
import uviews from './uviews';
import clicks from './clicks';
import topics from './topics';
import purchases from './purchases';
import realtime from './realtime';

export interface EndpointConfig {
  path: string;
  method: 'get' | 'post' | 'put' | 'delete';
  handler: RequestHandler;
  supportsBulk: boolean;
}

export const endpoints: Record<string, EndpointConfig> = Object.assign(views, uviews, clicks, topics, purchases, realtime);

// Helper per il bulk controller
export const bulkEndpointMap = Object.entries(endpoints)
  .filter(([_, config]) => config.supportsBulk)
  .reduce((acc, [_, config]) => ({
    ...acc,
    [config.path]: config.handler
  }), {} as Record<string, RequestHandler>); 