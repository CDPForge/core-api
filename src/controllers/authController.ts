import passport from 'passport';
import { Request, Response, NextFunction, RequestHandler } from 'express';
import UserPanel from '../models/userpanel';
import jwt from 'jsonwebtoken';

const generateTokens = (userData: any) => {
  const accessToken = jwt.sign(
    userData,
    process.env.JWT_SECRET || 'your-secret-key',
    { expiresIn: '6h' }
  );

  const refreshToken = jwt.sign(
    { id: userData.id },
    process.env.REFRESH_TOKEN_SECRET || 'your-refresh-secret-key',
    { expiresIn: '7d' }
  );

  return { accessToken, refreshToken };
};

// Funzione per gestire il login
export const login = (req: Request, res: Response, next: NextFunction) => {
  passport.authenticate('local', (err: Error, user: UserPanel, info: any) => {
    if (err) {
      return next(err);
    }

    if (!user) {
      return res.status(401).json({ 
        success: false, 
        message: 'Username o password non validi' 
      });
    }

    req.logIn(user, (err) => {
      if (err) {
        return next(err);
      }

      const userData = {
        id: user.id,
        username: user.mail,
        name: user.name,
        surname: user.surname,
        clients: user.UserClientRoles?.map(ucr => ({
          client: ucr.clientRelation.id,
          clientName: ucr.clientRelation.name,
          role: ucr.roleRelation.name
        }))
      };

      const { accessToken, refreshToken } = generateTokens(userData);

      // Impostiamo i cookie
      res.cookie('accessToken', accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        domain: process.env.COOKIE_DOMAIN || 'dominio.com', // Imposta il dominio principale
        maxAge: 6 * 60 * 60 * 1000 // 6 ore in millisecondi
      });

      res.cookie('refreshToken', refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        domain: process.env.COOKIE_DOMAIN || 'dominio.com', // Imposta il dominio principale
        maxAge: 7 * 24 * 60 * 60 * 1000 // 7 giorni in millisecondi
      });

      return res.status(200).json({
        success: true,
        message: 'Login effettuato con successo',
        accessToken,
        refreshToken,
        user: userData
      });
    });
  })(req, res, next);
};

export const refreshToken: RequestHandler = async (req: Request, res: Response) => {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    res.status(401).json({
      success: false,
      message: 'Refresh token mancante'
    });
    return;
  }

  try {
    const decoded = jwt.verify(
      refreshToken,
      process.env.REFRESH_TOKEN_SECRET || 'your-refresh-secret-key'
    ) as { id: number };

    const user = await UserPanel.findOne({
      where: { id: decoded.id },
      include: [{
        association: 'UserClientRoles',
        include: ['clientRelation', 'roleRelation']
      }]
    });

    if (!user) {
      res.status(401).json({
        success: false,
        message: 'Utente non trovato'
      });
      return;
    }

    const userData = {
      id: user.id,
      username: user.mail,
      name: user.name,
      surname: user.surname,
      clients: user.UserClientRoles?.map(ucr => ({
        client: ucr.clientRelation.id,
        clientName: ucr.clientRelation.name,
        role: ucr.roleRelation.name
      }))
    };

    const { accessToken, refreshToken: newRefreshToken } = generateTokens(userData);

    // Impostiamo i cookie
    res.cookie('accessToken', accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      domain: process.env.COOKIE_DOMAIN || 'dominio.com', // Imposta il dominio principale
      maxAge: 6 * 60 * 60 * 1000 // 6 ore in millisecondi
    });

    res.cookie('refreshToken', newRefreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      domain: process.env.COOKIE_DOMAIN || 'dominio.com', // Imposta il dominio principale
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 giorni in millisecondi
    });

    res.json({
      success: true,
      accessToken,
      refreshToken: newRefreshToken,
      user: userData
    });
  } catch (error) {
    res.status(401).json({
      success: false,
      message: 'Refresh token non valido'
    });
  }
};