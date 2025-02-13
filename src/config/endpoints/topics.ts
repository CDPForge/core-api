import { EndpointConfig } from './endpoints';

const endpoints: Record<string, EndpointConfig> = {
    'interests-total': {
        path: '/api/analytics/interests/total',
        method: 'get',
        handler: ()=>{},
        supportsBulk: true
    },
    'interests-groupby-topic': {
        path: '/api/analytics/interests/groupby/topic',
        method: 'get',
        handler: ()=>{},
        supportsBulk: true
    },
    'interests-daily': {
        path: '/api/analytics/interests/daily',
        method: 'get',
        handler: ()=>{},
        supportsBulk: true
    }
};

export default endpoints;