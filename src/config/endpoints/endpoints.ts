import { RequestHandler } from 'express';
import views from './views';
import uviews from './uviews';
import clicks from './clicks';
import topics from './topics';
import purchases from './purchases';


export interface EndpointConfig {
  path: string;
  method: 'get' | 'post' | 'put' | 'delete';
  handler: RequestHandler;
  supportsBulk: boolean;
}

export const endpoints: Record<string, EndpointConfig> = Object.assign(views, uviews, clicks, topics, purchases);

// Helper per il bulk controller
export const bulkEndpointMap = Object.entries(endpoints)
  .filter(([_, config]) => config.supportsBulk)
  .reduce((acc, [key, config]) => ({
    ...acc,
    [key]: config.handler
  }), {} as Record<string, RequestHandler>); 