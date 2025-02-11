import { RequestHandler } from 'express';
import { EndpointConfig } from './endpoints';
import { createGetVisitorsByGroup, getVisitors, getVisitorsLast3Hours} from '../../controllers/realtimeController';
const endpoints: Record<string, EndpointConfig> = {
    'realtime-visitors': {
        path: '/api/analytics/realtime/visitors',
        method: 'get',
        handler: getVisitors,
        supportsBulk: false
    },
    'realtime-visitors-last-3-hours': {
        path: '/api/analytics/realtime/visitors/last-3-hours',
        method: 'get',
        handler: getVisitorsLast3Hours,
        supportsBulk: false
    },
    'realtime-visitors-by-country': {
        path: '/api/analytics/realtime/visitors/groupby/country',
        method: 'get',
        handler: createGetVisitorsByGroup('country'),
        supportsBulk: false
    },
    'realtime-visitors-by-page': {
        path: '/api/analytics/realtime/visitors/groupby/page',
        method: 'get',
        handler: createGetVisitorsByGroup('pageTitle'),
        supportsBulk: false
    },
    'realtime-visitors-by-browser': {
        path: '/api/analytics/realtime/visitors/groupby/browser',
        method: 'get',
        handler: createGetVisitorsByGroup('browser'),
        supportsBulk: false
    }
};

export default endpoints;