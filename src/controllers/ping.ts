import { Request, Response, NextFunction, RequestHandler } from 'express';

// Funzione per gestire il login
export const ping: RequestHandler = (req: Request, res: Response) => {
    res.status(200).json({
        success: true,
        message: 'Pong!'
    });
};