import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import fs from 'fs';
import path from 'path';

const pubKey = fs.readFileSync(path.join(__dirname, '../../config/public.pem'), "utf8");

export const authenticateToken = (req: Request, res: Response, next: NextFunction) => {
  const token = req.cookies.accessToken || req.headers['authorization']?.split(' ')[1];
  const clientId = req.headers['x-client-id'];

  if (!token) {
    res.status(401).json({
      success: false,
      message: 'Token di accesso mancante'
    });
    return;
  }

  if (!clientId) {
    res.status(400).json({
      success: false,
      message: 'Client ID mancante'
    });
    return;
  }

  try {
    const decoded = jwt.verify(
      token,
      pubKey
    ) as any;

    const clientAccess = decoded.clients?.find(
      (c: any) => c.client === parseInt(clientId as string)
    );

    if (!clientAccess) {
      res.status(403).json({
        success: false,
        message: 'Non hai accesso a questo client'
      });
      return;
    }

    req.user = {
      ...decoded,
      currentClientRole: clientAccess.role,
      currentClientId: parseInt(clientId as string)
    };

    next();
  } catch (error) {
    res.status(403).json({
      success: false,
      message: 'Token non valido o scaduto'
    });
    return;
  }
}; 