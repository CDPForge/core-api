import { Request, Response } from 'express';
import { bulkRequest } from '../src/controllers/bulkController';
import { endpoints } from '../src/config/endpoints';

describe('Bulk Controller', () => {
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;
  let jsonMock: jest.Mock;

  beforeEach(() => {
    jsonMock = jest.fn();
    mockRes = {
      json: jsonMock,
      status: jest.fn().mockReturnThis()
    };
  });

  test('rifiuta richieste non array', async () => {
    mockReq = {
      body: {},
      user: { currentClientId: '123' }
    };

    await bulkRequest(mockReq as Request, mockRes as Response, jest.fn());

    expect(mockRes.status).toHaveBeenCalledWith(400);
    expect(jsonMock).toHaveBeenCalledWith({
      success: false,
      message: 'Il body deve essere un array di richieste'
    });
  });

  test('rifiuta richieste che superano il limite massimo', async () => {
    mockReq = {
      body: Array(11).fill({
        endpoint: 'views',
        params: { from: '2024-01-01', to: '2024-01-31' }
      }),
      user: { currentClientId: '123' }
    };

    await bulkRequest(mockReq as Request, mockRes as Response, jest.fn());

    expect(mockRes.status).toHaveBeenCalledWith(400);
    expect(jsonMock).toHaveBeenCalledWith({
      success: false,
      message: 'Numero massimo di richieste bulk consentite: 10'
    });
  });

  test('processa correttamente richieste multiple valide', async () => {
    mockReq = {
      body: [
        {
          endpoint: 'views',
          params: { from: '2024-01-01', to: '2024-01-31' }
        },
        {
          endpoint: 'daily-pageviews',
          params: { from: '2024-01-01', to: '2024-01-31' }
        }
      ],
      user: { currentClientId: '123' }
    };

    await bulkRequest(mockReq as Request, mockRes as Response, jest.fn());

    expect(jsonMock).toHaveBeenCalledWith(
      expect.objectContaining({
        success: true,
        results: expect.arrayContaining([
          expect.objectContaining({ endpoint: 'views' }),
          expect.objectContaining({ endpoint: 'daily-pageviews' })
        ])
      })
    );
  });

  test('gestisce endpoint non validi', async () => {
    mockReq = {
      body: [
        {
          endpoint: 'invalid-endpoint',
          params: { from: '2024-01-01', to: '2024-01-31' }
        }
      ],
      user: { currentClientId: '123' }
    };

    await bulkRequest(mockReq as Request, mockRes as Response, jest.fn());

    expect(jsonMock).toHaveBeenCalledWith(
      expect.objectContaining({
        success: true,
        results: [
          expect.objectContaining({
            endpoint: 'invalid-endpoint',
            success: false,
            error: 'Endpoint non valido'
          })
        ]
      })
    );
  });
});