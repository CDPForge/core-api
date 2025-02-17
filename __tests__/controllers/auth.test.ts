import request from 'supertest';
import express from 'express';
import passport from 'passport';
import cookieParser from 'cookie-parser';
import session from 'express-session';
import authRoutes from '../../src/routes/auth';
import bcrypt from 'bcrypt';

// Mock sequelize-typescript prima di importare i modelli
jest.mock('sequelize-typescript');

// Ora importiamo i modelli e la configurazione passport
import UserPanel from '../../src/models/userpanel';
import '../../src/config/passport';

const app = express();

// Setup middleware
app.use(express.json());
app.use(cookieParser());
app.use(session({
  secret: 'test-secret',
  resave: false,
  saveUninitialized: false
}));
app.use(passport.initialize());
app.use(passport.session());
app.use('/auth', authRoutes);

// Mock di UserPanel
jest.mock('../../src/models/userpanel', () => ({
  findOne: jest.fn(),
  findByPk: jest.fn()
}));

describe('Auth API', () => {
  let hashedPassword: string;

  beforeAll(async () => {
    hashedPassword = await bcrypt.hash('password123', 10);
  });

  beforeEach(() => {
    // Mock per il login
    (UserPanel.findOne as jest.Mock).mockResolvedValue({
      id: 1,
      mail: 'test@example.com',
      password: hashedPassword,
      name: 'Test',
      surname: 'User',
      UserClientRoles: [{
        clientRelation: {
          id: 1,
          name: 'Client 1'
        },
        roleRelation: {
          name: 'admin'
        }
      }]
    });

    // Mock per il refresh token
    (UserPanel.findByPk as jest.Mock).mockResolvedValue({
      id: 1,
      mail: 'test@example.com',
      name: 'Test',
      surname: 'User',
      UserClientRoles: [{
        clientRelation: {
          id: 1,
          name: 'Client 1'
        },
        roleRelation: {
          name: 'admin'
        }
      }]
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /auth/login', () => {
    it('dovrebbe effettuare il login con credenziali valide', async () => {
      const res = await request(app)
        .post('/auth/login')
        .send({
          username: 'test@example.com',
          password: 'password123'
        });

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('success', true);
      expect(res.body).toHaveProperty('accessToken');
      expect(res.body).toHaveProperty('refreshToken');
      expect(res.body.user).toHaveProperty('id', 1);
      expect(res.body.user).toHaveProperty('username', 'test@example.com');
      expect(res.headers['set-cookie']).toBeDefined();
      expect(res.headers['set-cookie']).toEqual(
        expect.arrayContaining([
          expect.stringContaining('accessToken='),
          expect.stringContaining('refreshToken=')
        ])
      );
    });

    it('dovrebbe fallire con credenziali non valide', async () => {
      (UserPanel.findOne as jest.Mock).mockResolvedValue(null);

      const res = await request(app)
        .post('/auth/login')
        .send({
          username: 'wrong@example.com',
          password: 'wrongpassword'
        });

      expect(res.status).toBe(401);
      expect(res.body).toHaveProperty('success', false);
      expect(res.body).toHaveProperty('message', 'Username o password non validi');
    });
  });

  describe('POST /auth/refresh', () => {
     xit('dovrebbe rinnovare i token con refresh token valido', async () => {
      // Prima facciamo il login per ottenere un refresh token valido
      const loginRes = await request(app)
        .post('/auth/login')
        .send({
          username: 'test@example.com',
          password: 'password123'
        });

      const refreshToken = loginRes.body.refreshToken;

      const res = await request(app)
        .post('/auth/refresh')
        .send({ refreshToken });

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('success', true);
      expect(res.body).toHaveProperty('accessToken');
      expect(res.body).toHaveProperty('refreshToken');
      expect(res.body.user).toHaveProperty('id', 1);
      expect(res.headers['set-cookie']).toBeDefined();
      expect(res.headers['set-cookie']).toEqual(
        expect.arrayContaining([
          expect.stringContaining('accessToken='),
          expect.stringContaining('refreshToken=')
        ])
      );
    });

    it('dovrebbe fallire con refresh token mancante', async () => {
      const res = await request(app)
        .post('/auth/refresh')
        .send({});

      expect(res.status).toBe(401);
      expect(res.body).toHaveProperty('success', false);
      expect(res.body).toHaveProperty('message', 'Refresh token mancante');
    });

    it('dovrebbe fallire con refresh token non valido', async () => {
      const res = await request(app)
        .post('/auth/refresh')
        .send({ refreshToken: 'invalid-token' });

      expect(res.status).toBe(401);
      expect(res.body).toHaveProperty('success', false);
      expect(res.body).toHaveProperty('message', 'Refresh token non valido');
    });
  });
});
