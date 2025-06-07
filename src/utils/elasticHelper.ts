import { Client } from '@elastic/elasticsearch';
import { AggregationsAggregationContainer, QueryDslQueryContainer } from '@elastic/elasticsearch/lib/api/types';
import Config from '../config';
import { on } from 'events';

export const esClient = new Client({
  node: Config.getInstance().config.esConfig.url,
  auth: {
    username: Config.getInstance().config.esConfig.username,
    password: Config.getInstance().config.esConfig.password
  }
});

export const getIndexPattern = (clientId: number) => `users-logs-${clientId}`;

export interface ESQueryParams {
  from?: string;
  to?: string;
  clientId: number;
  field?: string;
  interval?: string;
  event: string;
}

export const buildBaseQuery = (params: ESQueryParams): QueryDslQueryContainer => ({
  bool: {
    filter: [
      { term: { [esMapping.EVENT]: params.event } },
      params.from && params.to && {
        range: {
          [esMapping.DATE]: {
            gte: params.from,
            lte: params.to
          }
        }
      }
    ].filter(Boolean) as QueryDslQueryContainer[]
  }
});

export const esMapping = {
  DATE: "date",
  TOPICS: "googleTopics",
  PRODUCT: {
    PATH: "product",
    QUANTITY: "product.quantity",
    PRICE: "product.price",
    CURRENCY: "product.currency",
    ID: "product.id",
    CATEGORY: "product.category",
    BRAND: "product.brand"
  },
  INSTANCE: "instance",
  SESSION: "session",
  TARGET: "target",
  GEO: {
    PATH: "geo",
    COUNTRY: "geo.country",
    CITY: "geo.city",
    REGION: "geo.region",
    POINT: "geo.point"
  },
  REFERER: "referrer",
  EVENT: "event",
  CLIENT: "client",
  PAGE: {
    PATH: "page",
    IMAGE: "page.image",
    DESCRIPTION: "page.description",
    HREF: "page.href",
    TITLE: "page.title",
    TYPE: "page.type"
  },
  DEVICE: {
    PATH: "device",
    OS: "device.os",
    BROWSER: "device.browser",
    IP: "device.ip",
    USER_AGENT: "device.userAgent",
    ID: "device.id",
    TYPE: "device.type"
  }
}

export const buildGroupByQuery = (field: string, subAggs: AggregationsAggregationContainer | undefined = undefined, subAggName: string | undefined = undefined): AggregationsAggregationContainer => {
  const isNested: boolean = field.includes(".");
  let gbAggs: AggregationsAggregationContainer = {};
  if(subAggs != null) subAggs = JSON.parse(JSON.stringify(subAggs));
  if (isNested) {

    /*
    {
      nested: {
        path: esMapping.DEVICE.PATH
      },
      aggs: {
        unique_devices: {
          cardinality: {
            field: esMapping.DEVICE.ID
          }
        }
      }
    }*/
    if(subAggs?.nested?.path === field.split(".")[0]) {
      delete subAggs.nested;
      subAggs.filter = {
        exists: {
          field: field
        }
      }
    }

    gbAggs = {
      nested: {
        path: field.split(".")[0]
      },
      aggs: {
        inner_group_by: {
          terms: {
            field: field,
            size: 100
          },
          ...(subAggs && subAggName ? {
            aggs: {
              [subAggName]: subAggs
            }
          } : {})
        }
      }
    };
  } else {
    gbAggs = {
      terms: {
        field: field,
        size: 100
      },
      aggs: {
        ...(subAggs && subAggName ? {
          aggs: {
            [subAggName]: subAggs
          }
        } : {})
      }
    };
  }

  return gbAggs;
};