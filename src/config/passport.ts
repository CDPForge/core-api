import passport from 'passport';
import { Strategy as LocalStrategy } from 'passport-local';
import UserPanel from '../models/userpanel';
import bcrypt from 'bcrypt';
import UserClientRoles from '../models/userclientroles';
import Client from '../models/client';
import Roles from '../models/roles';

passport.use(new LocalStrategy(
  async (username: string, password: string, done) => {
    try {
      const user = await UserPanel.findOne({ 
        where: { username },
        include: [{
          model: UserClientRoles,
          include: [
            { model: Client },
            { model: Roles }
          ]
        }]
      });
      
      if (!user) {
        return done(null, false, { message: 'Username non trovato' });
      }

      const isValidPassword = await bcrypt.compare(password, user.password);
      
      if (!isValidPassword) {
        return done(null, false, { message: 'Password non valida' });
      }

      return done(null, user);
    } catch (error) {
      return done(error);
    }
  }
));

passport.serializeUser((user: any, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id: number, done) => {
  try {
    const user = await UserPanel.findByPk(id);
    done(null, user);
  } catch (error) {
    done(error);
  }
});

export default passport; 