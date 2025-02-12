import { getMockReq, getMockRes } from '@jest-mock/express';
import { getTotalPurchases, createGetPurchasesByGroup, getDailyPurchases } from '../../src/controllers/purchasesController';
import { esClient } from '../../src/utils/elasticHelper';

jest.mock('../../src/utils/elasticHelper');

describe('Purchases Controller', () => {
  const { res, clearMockRes } = getMockRes();
  
  beforeEach(() => {
    clearMockRes();
    (esClient.search as jest.Mock).mockClear();
  });

  describe('getTotalPurchases', () => {
    it('dovrebbe ritornare il totale degli acquisti con revenue e confronto periodo precedente', async () => {
      const req = getMockReq({
        user: { currentClientId: 1 },
        query: { from: '2024-03-01', to: '2024-03-07' }
      });

      (esClient.search as jest.Mock).mockResolvedValueOnce({
        aggregations: {
          current_purchases: {
            total_purchases: { value: 1000 },
            nested_products: {
              total_revenue: { value: 50000 }
            }
          },
          previous_purchases: {
            total_purchases: { value: 800 },
            nested_products: {
              total_revenue: { value: 40000 }
            }
          }
        }
      });

      await getTotalPurchases(req, res, jest.fn());

      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: {
          current_purchases: 1000,
          previous_purchases: 800,
          current_revenue: 50000,
          previous_revenue: 40000
        }
      });
    });
  });

  describe('getPurchasesByGroup', () => {
    it('dovrebbe raggruppare gli acquisti per campo nested', async () => {
      const req = getMockReq({
        user: { currentClientId: 1 },
        query: { from: '2024-03-01', to: '2024-03-07' }
      });

      (esClient.search as jest.Mock).mockResolvedValueOnce({
        aggregations: {
          group_by: {
            inner_group_by: {
              buckets: [
                { 
                  key: 'Electronics',
                  doc_count: 100,
                  nested_products: {
                    total_revenue: { value: 25000 }
                  }
                },
                { 
                  key: 'Books',
                  doc_count: 150,
                  nested_products: {
                    total_revenue: { value: 3000 }
                  }
                }
              ]
            }
          }
        }
      });

      const handler = createGetPurchasesByGroup('product.category');
      await handler(req, res, jest.fn());

      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: [
          { key: 'Electronics', count: 100, revenue: 25000 },
          { key: 'Books', count: 150, revenue: 3000 }
        ]
      });
    });

    it('dovrebbe raggruppare gli acquisti per campo normale', async () => {
      const req = getMockReq({
        user: { currentClientId: 1 },
        query: { from: '2024-03-01', to: '2024-03-07' }
      });

      (esClient.search as jest.Mock).mockResolvedValueOnce({
        aggregations: {
          group_by: {
            buckets: [
              { 
                key: 'IT',
                doc_count: 80,
                nested_products: {
                  total_revenue: { value: 15000 }
                }
              },
              { 
                key: 'FR',
                doc_count: 120,
                nested_products: {
                  total_revenue: { value: 18000 }
                }
              }
            ]
          }
        }
      });

      const handler = createGetPurchasesByGroup('geo.country');
      await handler(req, res, jest.fn());

      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: [
          { key: 'IT', count: 80, revenue: 15000 },
          { key: 'FR', count: 120, revenue: 18000 }
        ]
      });
    });
  });

  describe('getDailyPurchases', () => {
    it('dovrebbe ritornare gli acquisti giornalieri con revenue', async () => {
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
                doc_count: 100,
                nested_products: {
                  total_revenue: { value: 5000 }
                }
              },
              { 
                key_as_string: '2024-03-02',
                doc_count: 150,
                nested_products: {
                  total_revenue: { value: 7500 }
                }
              }
            ]
          }
        }
      });

      await getDailyPurchases(req, res, jest.fn());

      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: [
          { date: '2024-03-01', count: 100, revenue: 5000 },
          { date: '2024-03-02', count: 150, revenue: 7500 }
        ]
      });
    });
  });
}); 