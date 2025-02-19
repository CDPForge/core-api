import path from 'path';
import Config from './config';
import { Sequelize } from 'sequelize-typescript';
import './config/passport';
import passport from 'passport';
import express from 'express';
import authRoutes from './routes/auth';
import cookieParser from 'cookie-parser';
import { authenticateToken } from './middleware/authMiddleware';
import apiRoutes from './routes/api';
import cors from 'cors';
import { ping } from './controllers/ping';
const app = express();
new Sequelize(Config.getInstance().config.mysqlConfig.uri, { models: [path.join(__dirname, './models')] });

app.use(cors({
  origin: "*", // Cambia con il dominio del frontend
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"], // Metodi permessi
  allowedHeaders: ["Content-Type", "Authorization", "x-client-id"], // Header consentiti
  credentials: true // Se il frontend invia cookie o autenticazione
}));

// Abilita la gestione della richiesta preflight
app.options("*", cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

// Inizializzazione Passport
app.use(passport.initialize());


// Routes
app.use('/ping', ping);
app.use('/auth', authRoutes);
app.use('/api', authenticateToken, apiRoutes);

// Avvio del server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server in ascolto sulla porta ${PORT}`);
});
