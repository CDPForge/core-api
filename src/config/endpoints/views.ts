import { RequestHandler } from 'express';
import { EndpointConfig } from './endpoints';
import { getTotalViews, createGetViewsByGroup, getDailyViews } from '../../controllers/viewsController';

const endpoints: Record<string, EndpointConfig> = {
    'views-totale': {
        path: '/api/analytics/views/total',
        method: 'get',
        handler: getTotalViews,
        supportsBulk: true
    },
    'views-groupby-device': {
        path: '/api/analytics/views/groupby/device',
        method: 'get',
        handler: createGetViewsByGroup('device'),
        supportsBulk: true
    },
    'views-groupby-browser': {
        path: '/api/analytics/views/groupby/browser',
        method: 'get',
        handler: createGetViewsByGroup('browser'),
        supportsBulk: true
    },
    'views-groupby-referrer': {
        path: '/api/analytics/views/groupby/referrer',
        method: 'get',
        handler: createGetViewsByGroup('referrer'),
        supportsBulk: true
    },
    'views-groupby-city': {
        path: '/api/analytics/views/groupby/city',
        method: 'get',
        handler: createGetViewsByGroup('city'),
        supportsBulk: true
    },
    'views-daily': {
        path: '/api/analytics/views/daily',
        method: 'get',
        handler: getDailyViews,
        supportsBulk: true
    }
};

export default endpoints;