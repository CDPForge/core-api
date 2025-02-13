import { EndpointConfig } from './endpoints';
import { getTotalViews, createGetViewsByGroup, getDailyViews } from '../../controllers/viewsController';

const endpoints: Record<string, EndpointConfig> = {
    'views-total': {
        path: '/api/analytics/views/total',
        method: 'get',
        handler: getTotalViews,
        supportsBulk: true
    },
    'views-groupby-device': {
        path: '/api/analytics/views/groupby/device',
        method: 'get',
        handler: createGetViewsByGroup('device.type'),
        supportsBulk: true
    },
    'views-groupby-browser': {
        path: '/api/analytics/views/groupby/browser',
        method: 'get',
        handler: createGetViewsByGroup('device.browser'),
        supportsBulk: true
    },
    'views-groupby-os': {
        path: '/api/analytics/views/groupby/os',
        method: 'get',
        handler: createGetViewsByGroup('device.os'),
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
        handler: createGetViewsByGroup('geo.city'),
        supportsBulk: true
    },
    'views-groupby-country': {
        path: '/api/analytics/views/groupby/country',
        method: 'get',
        handler: createGetViewsByGroup('geo.country'),
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