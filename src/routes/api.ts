import { Router } from 'express';
import { bulkRequest } from '../controllers/bulkController';
import analyticsRoutes from './analytics';

const router = Router();


router.post('/bulk', bulkRequest);
router.use('/analytics', analyticsRoutes);

export default router;
