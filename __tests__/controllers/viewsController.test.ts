import { getMockReq, getMockRes } from '@jest-mock/express';
import { getTotalViews, createGetViewsByGroup, getDailyViews } from '../../src/controllers/viewsController';
import { esClient } from '../../src/utils/elasticHelper';

jest.mock('../../src/utils/elasticHelper');

describe('Views Controller', () => {
  const { res, clearMockRes } = getMockRes();
  
  beforeEach(() => {
    clearMockRes();
    (esClient.search as jest.Mock).mockClear();
  });

  describe('getTotalViews', () => {
    it('dovrebbe ritornare il totale delle views con confronto periodo precedente', async () => {
      const req = getMockReq({
        user: { currentClientId: 1 },
        query: { from: '2024-03-01', to: '2024-03-07' }
      });

      (esClient.search as jest.Mock).mockResolvedValueOnce({
        aggregations: {
          current_views: { total_views: { value: 1000 } },
          previous_views: { total_views: { value: 800 } }
        }
      });

      await getTotalViews(req, res, jest.fn());

      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: {
          current_views: 1000,
          previous_views: 800
        }
      });
    });
  });
  describe('getDailyViews', () => {
    it('dovrebbe ritornare le views giornaliere', async () => {
      const req = getMockReq({
        user: { currentClientId: 1 },
        query: { from: '2024-03-01', to: '2024-03-07' }
      });

      (esClient.search as jest.Mock).mockResolvedValueOnce({
        aggregations: {
          daily: {
            buckets: [
              { key_as_string: '2024-03-01', doc_count: 100 },
              { key_as_string: '2024-03-02', doc_count: 150 },
              { key_as_string: '2024-03-03', doc_count: 200 }
            ]
          } 
        }
      });

      await getDailyViews(req, res, jest.fn());

      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: [
          { date: '2024-03-01', count: 100 },
          { date: '2024-03-02', count: 150 },
          { date: '2024-03-03', count: 200 }
        ]
      });
    });
  });

  describe('getViewsByGroup', () => {
    it('dovrebbe raggruppare le views per il campo specificato nested', async () => {
      const req = getMockReq({
        user: { currentClientId: 1 },
        query: { from: '2024-03-01', to: '2024-03-07' }
      });

      (esClient.search as jest.Mock).mockResolvedValueOnce({
        aggregations: {
          group_by: {
            inner_group_by: {
              buckets: [
                { key: 'chrome', doc_count: 500 },
                { key: 'firefox', doc_count: 300 }
              ]
            }
          }
        }
      });

      const handler = createGetViewsByGroup('device.browser');
      await handler(req, res, jest.fn());

      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: [
          { key: 'chrome', count: 500 },
          { key: 'firefox', count: 300 }
        ]
      });
    });

    it('dovrebbe raggruppare le views per il campo specificato term', async () => {
      const req = getMockReq({
        user: { currentClientId: 1 },
        query: { from: '2024-03-01', to: '2024-03-07' }
      });

      (esClient.search as jest.Mock).mockResolvedValueOnce({
        aggregations: {
          group_by: {
            buckets: [
              { key: 'https://www.google.com', doc_count: 100 },
              { key: 'https://www.facebook.com', doc_count: 80 }
            ]
          }
        }
      });

      const handler = createGetViewsByGroup('referrer');
      await handler(req, res, jest.fn());

      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: [
          { key: 'https://www.google.com', count: 100 },
          { key: 'https://www.facebook.com', count: 80 }
        ]
      });
    });
  });
}); 