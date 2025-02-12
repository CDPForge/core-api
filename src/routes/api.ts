import { Router } from 'express';
import { ping } from '../controllers/ping';
import { bulkRequest } from '../controllers/bulkController';
import analyticsRoutes from './analytics';

const router = Router();

router.get('/ping', ping);
router.post('/bulk', bulkRequest);
router.use('/analytics', analyticsRoutes);

export default router;
