import { Router } from 'express';
import * as authController from '../controllers/authController';

const router = Router();

// Rotte di login, home e logout
router.get('/login', (req, res) => {
  res.send('<form action="/login" method="post">' +
           'Username: <input type="text" name="username"><br>' +
           'Password: <input type="password" name="password"><br>' +
           '<input type="submit" value="Login">' +
           '</form>');
});

router.post('/login', authController.login);
router.get('/home', authController.home);
router.get('/logout', authController.logout);

export default router;
