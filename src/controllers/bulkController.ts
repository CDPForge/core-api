import { Request, Response, RequestHandler } from 'express';
import { bulkEndpointMap } from '../config/endpoints';

const MAX_BULK_REQUESTS = 10;

interface BulkRequestItem {
  endpoint: string;
  params: {
    from?: string;
    to?: string;
    [key: string]: any;
  };
}

export const bulkRequest: RequestHandler = async (req: Request, res: Response) => {
  const requests: BulkRequestItem[] = req.body;

  if (!Array.isArray(requests)) {
    res.status(400).json({
      success: false,
      message: 'Il body deve essere un array di richieste'
    });
    return;
  }

  if (requests.length > MAX_BULK_REQUESTS) {
    res.status(400).json({
      success: false,
      message: `Numero massimo di richieste bulk consentite: ${MAX_BULK_REQUESTS}`
    });
    return;
  }

  try {
    const results = await Promise.all(
      requests.map(async (request) => {
        const handler = Object.entries(bulkEndpointMap).find(
          ([path]) => path === request.endpoint
        )?.[1];
        
        if (!handler) {
          return {
            endpoint: request.endpoint,
            success: false,
            error: 'Endpoint non valido'
          };
        }

        const mockReq = {
          ...req,
          query: request.params,
          user: req.user
        };

        let responseData: any = null;
        let responseStatus = 200;

        const mockRes = {
          json: (data: any) => {
            responseData = data;
          },
          status: (status: number) => {
            responseStatus = status;
            return mockRes;
          }
        };

        await handler(mockReq as Request, mockRes as any, () => {});

        return {
          endpoint: request.endpoint,
          success: responseStatus === 200,
          data: responseData
        };
      })
    );

    res.json({
      success: true,
      results
    });

  } catch (error) {
    console.error('Bulk request error:', error);
    res.status(500).json({
      success: false,
      message: 'Errore nell\'elaborazione delle richieste bulk'
    });
  }
}; 