import { RequestHandler } from 'express';
import { EndpointConfig } from './endpoints';
import { createGetPurchasesByGroup, getDailyPurchases, getTotalPurchases } from '../../controllers/purchasesController';

const endpoints: Record<string, EndpointConfig> = {
    'purchases-totale': {
        path: '/api/analytics/purchases/total',
        method: 'get',
        handler: getTotalPurchases,
        supportsBulk: true
    },
    'purchases-groupby-device': {
        path: '/api/analytics/purchases/groupby/device',
        method: 'get',
        handler: createGetPurchasesByGroup('device.type'),
        supportsBulk: true
    },
    'purchases-groupby-browser': {
        path: '/api/analytics/purchases/groupby/browser',
        method: 'get',
        handler: createGetPurchasesByGroup('device.browser'),
        supportsBulk: true
    },
    'purchases-groupby-product': {
        path: '/api/analytics/purchases/groupby/product',
        method: 'get',
        handler: createGetPurchasesByGroup('product.id'),
        supportsBulk: true
    },
    'purchases-groupby-brand': {
        path: '/api/analytics/purchases/groupby/brand',
        method: 'get',
        handler: createGetPurchasesByGroup('product.brand'),
        supportsBulk: true
    },
    'purchases-groupby-category': {
        path: '/api/analytics/purchases/groupby/category',
        method: 'get',
        handler: createGetPurchasesByGroup('product.category'),
        supportsBulk: true
    },
    'purchases-groupby-city': {
        path: '/api/analytics/purchases/groupby/city',
        method: 'get',
        handler: createGetPurchasesByGroup('geo.city'),
        supportsBulk: true
    },
    'purchases-groupby-country': {
        path: '/api/analytics/purchases/groupby/country',
        method: 'get',
        handler: createGetPurchasesByGroup('geo.country'),
        supportsBulk: true
    },
    'purchases-daily': {
        path: '/api/analytics/purchases/daily',
        method: 'get',
        handler: getDailyPurchases,
        supportsBulk: true
    }
};

export default endpoints;