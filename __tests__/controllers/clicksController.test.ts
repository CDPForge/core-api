import { getMockReq, getMockRes } from '@jest-mock/express';
import { getTotalClicks, getClicksByTarget, getDailyClicks } from '../../src/controllers/clicksController';
import { esClient } from '../../src/utils/elasticHelper';

jest.mock('../../src/utils/elasticHelper');

describe('Clicks Controller', () => {
  const { res, clearMockRes } = getMockRes();
  
  beforeEach(() => {
    clearMockRes();
  });

  describe('getTotalClicks', () => {
    it('dovrebbe ritornare il totale dei click con confronto periodo precedente', async () => {
      const req = getMockReq({
        user: { currentClientId: 1 },
        query: { from: '2024-03-01', to: '2024-03-07' }
      });

      (esClient.search as jest.Mock).mockResolvedValueOnce({
        aggregations: {
          current_clicks: { total_clicks: { value: 2000 } },
          previous_clicks: { total_clicks: { value: 1500 } }
        }
      });

      await getTotalClicks(req, res, jest.fn());

      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: {
          current_clicks: 2000,
          previous_clicks: 1500
        }
      });
    });
  });

  describe('getClicksByTarget', () => {
    it('dovrebbe raggruppare i click per target', async () => {
      const req = getMockReq({
        user: { currentClientId: 1 },
        query: { from: '2024-03-01', to: '2024-03-07' }
      });

      (esClient.search as jest.Mock).mockResolvedValueOnce({
        aggregations: {
          group_by: {
            buckets: [
              { key: 'button-1', doc_count: 1000 },
              { key: 'link-2', doc_count: 500 }
            ]
          }
        }
      });

      await getClicksByTarget(req, res, jest.fn());
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: [
          { key: 'button-1', count: 1000 },
          { key: 'link-2', count: 500 }
        ]
      });
    });

    it('dovrebbe gestire gli errori', async () => {
      const req = getMockReq({
        user: { currentClientId: 1 },
        query: { from: '2024-03-01', to: '2024-03-07' }
      });

      (esClient.search as jest.Mock).mockRejectedValueOnce(new Error('Errore test'));

      await getClicksByTarget(req, res, jest.fn());

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Errore nel recupero delle statistiche'
      });
    });
  });

  describe('getDailyClicks', () => {
    it('dovrebbe ritornare i click giornalieri', async () => {
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
                doc_count: 100
              },
              { 
                key_as_string: '2024-03-02',
                doc_count: 150 
              },
              {
                key_as_string: '2024-03-03',
                doc_count: 200
              }
            ]
          }
        }
      });

      await getDailyClicks(req, res, jest.fn());

      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: [
          { date: '2024-03-01', count: 100 },
          { date: '2024-03-02', count: 150 },
          { date: '2024-03-03', count: 200 }
        ]
      });
    });

    it('dovrebbe gestire gli errori', async () => {
      const req = getMockReq({
        user: { currentClientId: 1 },
        query: { from: '2024-03-01', to: '2024-03-07' }
      });

      (esClient.search as jest.Mock).mockRejectedValueOnce(new Error('Errore test'));

      await getDailyClicks(req, res, jest.fn());

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Errore nel recupero delle statistiche'
      });
    });
  });
}); 