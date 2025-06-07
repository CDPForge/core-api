import { Router } from 'express';
import { endpoints } from '../config/endpoints/endpoints';

const router = Router();

Object.entries(endpoints).forEach(([_, config]) => {
  if (config.path.startsWith('/api/analytics')) {
    const localPath = config.path.replace('/api/analytics', '');
    router[config.method](localPath, config.handler);
  }
});

export default router; 