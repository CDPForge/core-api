import { RequestHandler } from 'express';
import { EndpointConfig } from './endpoints';
import { getTotalUViews, createGetUViewsByGroup, getDailyUViews, getNewReturning } from '../../controllers/uviewsController';

const endpoints: Record<string, EndpointConfig> = {
    'uviews-totale': {
        path: '/api/analytics/uviews/total',
        method: 'get',
        handler: getTotalUViews,
        supportsBulk: true
    },
    'uviews-groupby-device': {
        path: '/api/analytics/uviews/groupby/device',
        method: 'get',
        handler: createGetUViewsByGroup('device'),
        supportsBulk: true
    },
    'uviews-groupby-browser': {
        path: '/api/analytics/uviews/groupby/browser',
        method: 'get',
        handler: createGetUViewsByGroup('browser'),
        supportsBulk: true
    },
    'uviews-groupby-referrer': {
        path: '/api/analytics/uviews/groupby/referrer',
        method: 'get',
        handler: createGetUViewsByGroup('referrer'),
        supportsBulk: true
    },
    'uviews-groupby-city': {
        path: '/api/analytics/uviews/groupby/city',
        method: 'get',
        handler: createGetUViewsByGroup('city'),
        supportsBulk: true
    },
    'uviews-daily': {
        path: '/api/analytics/uviews/daily',
        method: 'get',
        handler: getDailyUViews,
        supportsBulk: true
    },
    'new-vs-returning': {
        path: '/api/analytics/uviews/new-returning',
        method: 'get',
        handler: getNewReturning,
        supportsBulk: true
    }
};

export default endpoints;