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


const app = express();
new Sequelize(Config.getInstance().config.mysqlConfig.uri,{models: [path.join(__dirname, './models')]});

app.use(cookieParser());
app.use(passport.initialize());
app.use(passport.session());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

app.use('/auth', authRoutes);

// Applica il middleware di autenticazione a tutte le altre routes
app.use('/api', authenticateToken, apiRoutes);

// Qui inserisci tutte le altre routes protette
// app.use('/api/users', userRoutes);
// app.use('/api/clients', clientRoutes);
// etc...

