import { Client } from '@elastic/elasticsearch';
import { AggregationsAggregationContainer, AggregationsExtendedStatsAggregate, QueryDslQueryContainer } from '@elastic/elasticsearch/lib/api/types';

export const esClient = new Client({
  node: process.env.ELASTICSEARCH_URL || 'http://localhost:9200'
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
  if (isNested) {
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