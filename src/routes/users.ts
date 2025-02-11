import { Router } from 'express';
import { endpoints } from '../config/endpoints/endpoints';

const router = Router();

// Registra automaticamente tutti gli endpoint relativi agli users
Object.entries(endpoints).forEach(([_, config]) => {
  if (config.path.startsWith('/api/users')) {
    const localPath = config.path.replace('/api/users', '');
    router[config.method](localPath, config.handler);
  }
});

export default router; 