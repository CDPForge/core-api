import { Router } from 'express';
import { ping } from '../controllers/ping';
import userRoutes from './users';
import { bulkRequest } from '../controllers/bulkController';

const router = Router();

router.get('/ping', ping);
router.post('/bulk', bulkRequest);
router.use('/users', userRoutes);

export default router;
