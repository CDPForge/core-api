import { getMockReq, getMockRes } from '@jest-mock/express';
import { getTotalUViews, createGetUViewsByGroup, getDailyUViews, getNewReturning } from '../../src/controllers/uviewsController';
import { esClient } from '../../src/utils/elasticHelper';

jest.mock('../../src/utils/elasticHelper');

describe('Unique Views Controller', () => {
  const { res, clearMockRes } = getMockRes();
  
  beforeEach(() => {
    clearMockRes();
    (esClient.search as jest.Mock).mockClear();
  });

  describe('getTotalUniqueViews', () => {
    it('dovrebbe ritornare il totale delle unique views con confronto periodo precedente', async () => {
      const req = getMockReq({
        user: { currentClientId: 1 },
        query: { from: '2024-03-01', to: '2024-03-07' }
      });

      (esClient.search as jest.Mock).mockResolvedValueOnce({
        aggregations: {
          current_views: {
            unique_devices: { value: 500 }
          },
          previous_views: {
            unique_devices: { value: 400 }
          }
        }
      });

      await getTotalUViews(req, res, jest.fn());

      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: {
          current_unique_views: 500,
          previous_unique_views: 400
        }
      });
    });
  });

  describe('getDailyUViews', () => {
    it('dovrebbe ritornare le unique views giornaliere', async () => {
      const req = getMockReq({
        user: { currentClientId: 1 },
        query: { from: '2024-03-01', to: '2024-03-07' }
      });

      (esClient.search as jest.Mock).mockResolvedValueOnce({
        aggregations: {
          daily: {
            buckets: [
              { 
                key_as_string: '2024-03-01',
                unique_devices: { value: 100 }
              },
              { 
                key_as_string: '2024-03-02', 
                unique_devices: { value: 150 }
              },
              { 
                key_as_string: '2024-03-03',
                unique_devices: { value: 200 }
              }
            ]
          }
        }
      });

      await getDailyUViews(req, res, jest.fn());

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

  describe('getNewReturning', () => {
    it('dovrebbe ritornare il conteggio di utenti nuovi e di ritorno', async () => {
      const req = getMockReq({
        user: { currentClientId: 1 },
        query: { from: '2024-03-01', to: '2024-03-07' }
      });

      (esClient.search as jest.Mock).mockResolvedValueOnce({
        aggregations: {
          new_users: {
            unique_new_users: { value: 150 }
          },
          returning_users: {
            unique_returning_users: { value: 350 }
          },
          prev_new_users: {
            unique_new_users: { value: 200 }
          },
          prev_returning_users: {
            unique_returning_users: { value: 420 }
          }
        }
      });

      await getNewReturning(req, res, jest.fn());

      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: {
          newUsers: 150,
          returningUsers: 350,
          prevNewUsers: 200,
          prevReturningUsers: 420
        }
      });
    });
  });

  describe('getUniqueViewsByGroup', () => {
    it('dovrebbe raggruppare le unique views per il campo specificato', async () => {
      const req = getMockReq({
        user: { currentClientId: 1 },
        query: { from: '2024-03-01', to: '2024-03-07' }
      });

      (esClient.search as jest.Mock).mockResolvedValueOnce({
        aggregations: {
          group_by: {
            buckets: [
              { 
                key: 'mobile',
                unique_devices: { value: 300 }
              },
              { 
                key: 'desktop',
                unique_devices: { value: 200 }
              }
            ]
          }
        }
      });

      const handler = createGetUViewsByGroup('deviceType');
      await handler(req, res, jest.fn());

      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: [
          { key: 'mobile', count: 300 },
          { key: 'desktop', count: 200 }
        ]
      });
    });
  });
}); 

  
