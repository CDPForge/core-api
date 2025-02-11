import request from 'supertest';
import express from 'express';
import { Client } from '@elastic/elasticsearch';
import session from 'express-session';
import { Request, Response } from 'express';
import { getDailyPageViews, getPageViews, getNewUsers } from '../src/controllers/logsController';

jest.mock('@elastic/elasticsearch');

const app = express();

// Setup middleware
app.use(express.json());
app.use(session({
  secret: 'test-secret',
  resave: false,
  saveUninitialized: false
}));

// Mock user authentication
app.use((req, res, next) => {
  req.user = {
    currentClientId: 1,
    currentClientRole: 'admin'
  };
  next();
});

import apiRoutes from '../src/routes/api';
app.use('/api', apiRoutes);

describe('User Controller', () => {
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;
  let jsonMock: jest.Mock;
  let statusMock: jest.Mock;

  beforeEach(() => {
    jsonMock = jest.fn();
    statusMock = jest.fn().mockReturnThis();
    mockRes = {
      json: jsonMock,
      status: statusMock
    };
    mockReq = {
      user: { currentClientId: 1 },
      query: { from: '2024-03-01', to: '2024-03-02' }
    };
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getDailyPageViews', () => {
    beforeEach(() => {
      (Client.prototype.search as jest.Mock).mockResolvedValue({
        aggregations: {
          daily_views: {
            buckets: [
              {
                key_as_string: '2024-03-01',
                doc_count: 150,
                unique_devices: { value: 75 }
              },
              {
                key_as_string: '2024-03-02',
                doc_count: 200,
                unique_devices: { value: 100 }
              }
            ]
          }
        }
      });
    });

    it('dovrebbe ritornare le statistiche giornaliere', async () => {
      await getDailyPageViews(mockReq as Request, mockRes as Response, jest.fn());

      expect(jsonMock).toHaveBeenCalledWith({
        success: true,
        data: [
          {
            date: '2024-03-01',
            totalViews: 150,
            uniqueDevices: 75
          },
          {
            date: '2024-03-02',
            totalViews: 200,
            uniqueDevices: 100
          }
        ]
      });
    });

    it('dovrebbe gestire errori di Elasticsearch', async () => {
      (Client.prototype.search as jest.Mock).mockRejectedValue(new Error('ES Error'));

      await getDailyPageViews(mockReq as Request, mockRes as Response, jest.fn());

      expect(statusMock).toHaveBeenCalledWith(500);
      expect(jsonMock).toHaveBeenCalledWith({
        success: false,
        message: 'Errore nel recupero delle statistiche'
      });
    });
  });

  describe('getPageViews', () => {
    beforeEach(() => {
      (Client.prototype.search as jest.Mock).mockResolvedValue({
        aggregations: {
          total_views: { value: 350 },
          unique_devices: { value: 175 }
        }
      });
    });

    it('dovrebbe ritornare il totale delle visualizzazioni', async () => {
      await getPageViews(mockReq as Request, mockRes as Response, jest.fn());

      expect(jsonMock).toHaveBeenCalledWith({
        success: true,
        data: {
          totalViews: 350,
          uniqueDevices: 175
        }
      });
    });

    it('dovrebbe validare i parametri from e to', async () => {
      mockReq.query = {};
      
      await getPageViews(mockReq as Request, mockRes as Response, jest.fn());

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith({
        success: false,
        message: 'I parametri from e to sono obbligatori'
      });
    });
  });

  describe('getUsersStats', () => {
    beforeEach(() => {
      (Client.prototype.search as jest.Mock).mockResolvedValue({
        aggregations: {
          new_users: {
            unique_new_users: { value: 50 }
          },
          returning_users: {
            unique_returning_users: { value: 25 }
          }
        }
      });
    });

    it('dovrebbe ritornare statistiche utenti nuovi e di ritorno', async () => {
      await getNewUsers(mockReq as Request, mockRes as Response, jest.fn());

      expect(jsonMock).toHaveBeenCalledWith({
        success: true,
        data: {
          newUsers: 50,
          returningUsers: 25
        }
      });
    });

    it('dovrebbe validare i parametri from e to', async () => {
      mockReq.query = {};
      
      await getNewUsers(mockReq as Request, mockRes as Response, jest.fn());

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith({
        success: false,
        message: 'I parametri from e to sono obbligatori'
      });
    });

    it('dovrebbe gestire errori di Elasticsearch', async () => {
      (Client.prototype.search as jest.Mock).mockRejectedValue(new Error('ES Error'));

      await getNewUsers(mockReq as Request, mockRes as Response, jest.fn());

      expect(statusMock).toHaveBeenCalledWith(500);
      expect(jsonMock).toHaveBeenCalledWith({
        success: false,
        message: 'Errore nel recupero delle statistiche'
      });
    });
  });

  describe('Validazione parametri comuni', () => {
    const controllers = [getDailyPageViews, getPageViews, getNewUsers];
    
    test.each(controllers)('dovrebbe richiedere from e to per %p', async (controller) => {
      mockReq.query = {};
      
      await controller(mockReq as Request, mockRes as Response, jest.fn());

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith({
        success: false,
        message: 'I parametri from e to sono obbligatori'
      });
    });
  });
}); 