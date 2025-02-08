import passport from 'passport';
import { Request, Response, NextFunction } from 'express';

// Funzione per gestire il login
export const login = (req: Request, res: Response, next: NextFunction) => {
  passport.authenticate('local', {
    successRedirect: '/home',
    failureRedirect: '/login',
    failureFlash: true,
  })(req, res, next);
};

// Funzione per la pagina home
export const home = (req: Request, res: Response) => {
  if (req.isAuthenticated()) {
    res.send(`Benvenuto, ${req.user?.username}! <br><a href="/logout">Logout</a>`);
  } else {
    res.redirect('/login');
  }
};

// Funzione per il logout
export const logout = (req: Request, res: Response) => {
  req.logout((err: any) => {
    res.redirect('/login');
  });
};
