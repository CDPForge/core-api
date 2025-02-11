import { getMockReq, getMockRes } from '@jest-mock/express';
import { bulkRequest } from '../../src/controllers/bulkController';
import { esClient } from '../../src/utils/elasticHelper';

jest.mock('../../src/utils/elasticHelper');

describe('Bulk Controller', () => {
  const { res, clearMockRes } = getMockRes();
  
  beforeEach(() => {
    clearMockRes();
  });

  it('dovrebbe gestire richieste bulk multiple', async () => {
    const req = getMockReq({
      cookies: {
        accessToken: 'valid-token'
      },
      headers: {
        'x-client-id': '1'
      },
      user: { currentClientId: 1 },
      body: [
        {
          endpoint: '/api/analytics/views/total',
          params: {
            from: '2024-03-01',
            to: '2024-03-07'
          }
        },
        {
          endpoint: '/api/analytics/views/groupby/browser',
          params: {
            from: '2024-03-01',
            to: '2024-03-07'
          }
        }
      ]
    });

    (esClient.search as jest.Mock)
      .mockResolvedValueOnce({
        aggregations: {
          current_views: { total_views: { value: 1000 } },
          previous_views: { total_views: { value: 800 } }
        }
      })
      .mockResolvedValueOnce({
        aggregations: {
          group_by: {
            buckets: [
              { key: 'chrome', doc_count: 500 },
              { key: 'firefox', doc_count: 300 }
            ]
          }
        }
      });

    await bulkRequest(req, res, jest.fn());

    expect(res.json).toHaveBeenCalledWith({
      success: true,
      results: [
        {
          endpoint: '/api/analytics/views/total',
          success: true,
          data: {
            current_views: 1000,
            previous_views: 800
          }
        },
        {
          endpoint: '/api/analytics/views/groupby/browser',
          success: true,
          data: [
            { key: 'chrome', count: 500 },
            { key: 'firefox', count: 300 }
          ]
        }
      ]
    });
  });

  it('dovrebbe gestire errori nelle richieste bulk', async () => {
    const req = getMockReq({
      cookies: {
        accessToken: 'valid-token'
      },
      headers: {
        'x-client-id': '1'
      },
      user: { currentClientId: 1 },
      body: [
        {
          endpoint: '/api/invalid/endpoint',
          params: {}
        }
      ]
    });

    await bulkRequest(req, res, jest.fn());

    expect(res.json).toHaveBeenCalledWith({
      success: true,
      results: [
        {
          endpoint: '/api/invalid/endpoint',
          success: false,
          error: 'Endpoint non valido'
        }
      ]
    });
  });
}); 