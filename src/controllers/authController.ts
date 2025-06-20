import passport from 'passport';
import { Request, Response, NextFunction, RequestHandler } from 'express';
import UserPanel from '../models/userpanel';
import jwt from 'jsonwebtoken';
import fs from 'fs';
import path from 'path';

const privateKey = fs.readFileSync(path.join(__dirname, '../../config/private.pem'), 'utf8');

const generateTokens = (userData: any) => {
  const accessToken = jwt.sign(
    userData,
    privateKey,
    { expiresIn: '6h',  algorithm: "RS256" }
  );

  const refreshToken = jwt.sign(
    { id: userData.id },
    privateKey,
    { expiresIn: '7d',  algorithm: "RS256"  }
  );

  return { accessToken, refreshToken };
};

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

    res.cookie('accessToken', accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      domain: process.env.COOKIE_DOMAIN || 'dominio.com',
      maxAge: 6 * 60 * 60 * 1000
    });

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      domain: process.env.COOKIE_DOMAIN || 'dominio.com',
      maxAge: 7 * 24 * 60 * 60 * 1000
    });

    return res.status(200).json({
      success: true,
      message: 'Login effettuato con successo',
      accessToken,
      refreshToken,
      user: userData
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

    res.cookie('accessToken', accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      domain: process.env.COOKIE_DOMAIN || 'dominio.com',
      maxAge: 6 * 60 * 60 * 1000
    });

    res.cookie('refreshToken', newRefreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      domain: process.env.COOKIE_DOMAIN || 'dominio.com',
      maxAge: 7 * 24 * 60 * 60 * 1000
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