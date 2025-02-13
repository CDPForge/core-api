import { EndpointConfig } from './endpoints';
import { getTotalClicks, getClicksByTarget, getDailyClicks } from '../../controllers/clicksController';
const endpoints: Record<string, EndpointConfig> = {
    'clicks-totale': {
        path: '/api/analytics/clicks/total',
        method: 'get',
        handler: getTotalClicks,
        supportsBulk: true
    },
    'clicks-groupby-target': {
        path: '/api/analytics/clicks/groupby/target',
        method: 'get',
        handler: getClicksByTarget,
        supportsBulk: true
    },
    'clicks-daily': {
        path: '/api/analytics/clicks/daily',
        method: 'get',
        handler: getDailyClicks,
        supportsBulk: true
    }
};

export default endpoints;