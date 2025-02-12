import { getMockReq, getMockRes } from '@jest-mock/express';
import { getVisitors, getVisitorsLast3Hours, createGetVisitorsByGroup } from '../../src/controllers/realtimeController';
import { esClient } from '../../src/utils/elasticHelper';

jest.mock('../../src/utils/elasticHelper');

describe('Realtime Controller', () => {
  const { res, clearMockRes } = getMockRes();
  
  beforeEach(() => {
    clearMockRes();
  });

  describe('getVisitors', () => {
    it('dovrebbe ritornare i visitatori degli ultimi 15 minuti', async () => {
      const req = getMockReq({
        user: { currentClientId: 1 }
      });

      (esClient.search as jest.Mock).mockResolvedValueOnce({
        aggregations: {
          nested_device: { unique_visitors: { value: 150 } }
        }
      });

      await getVisitors(req, res, jest.fn());

      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: { visitors: 150 }
      });
    });
  });

  describe('createGetVisitorsByGroup', () => {
    it('dovrebbe raggruppare i visitatori per il campo specificato', async () => {
      const req = getMockReq({
        user: { currentClientId: 1 }
      });

      (esClient.search as jest.Mock).mockResolvedValueOnce({
        aggregations: {
          group_by: {
            buckets: [
              {
                key: 'mobile',
                nested_device: { unique_visitors: { value: 80 } }
              },
              {
                key: 'desktop', 
                nested_device: { unique_visitors: { value: 70 } }
              }
            ]
          }
        }
      });

      const handler = createGetVisitorsByGroup('device.type');
      await handler(req, res, jest.fn());

      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: [
          { key: 'mobile', visitors: 80 },
          { key: 'desktop', visitors: 70 }
        ]
      });
    });

    it('dovrebbe gestire gli errori', async () => {
      const req = getMockReq({
        user: { currentClientId: 1 }
      });

      (esClient.search as jest.Mock).mockRejectedValueOnce(new Error('Errore test'));

      const handler = createGetVisitorsByGroup('device');
      await handler(req, res, jest.fn());

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Errore nel recupero delle statistiche in tempo reale'
      });
    });
  });

  describe('getVisitorsLast3Hours', () => {
    it('dovrebbe ritornare i visitatori per intervalli di 10 minuti', async () => {
      const req = getMockReq({
        user: { currentClientId: 1 }
      });

      (esClient.search as jest.Mock).mockResolvedValueOnce({
        aggregations: {
          last10m: {
            buckets: [
              {
                key_as_string: '2024-03-07 10:00',
                nested_device: { unique_visitors: { value: 50 } }
              },
              {
                key_as_string: '2024-03-07 10:10',
                nested_device: { unique_visitors: { value: 60 } }
              }
            ]
          }
        }
      });

      await getVisitorsLast3Hours(req, res, jest.fn());

      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: {
          visitors: [
            { date: '2024-03-07 10:00', visitors: 50 },
            { date: '2024-03-07 10:10', visitors: 60 }
          ]
        }
      });
    });
  });
}); 