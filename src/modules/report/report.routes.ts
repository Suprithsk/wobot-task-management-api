import { Router } from 'express';
import authenticate from '../../middleware/authenticate';
import { getReport } from './report.controller';

const router = Router({ mergeParams: true });

router.use(authenticate);

router.get('/:id/report', getReport);

export default router;
