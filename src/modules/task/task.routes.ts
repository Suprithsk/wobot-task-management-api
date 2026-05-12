import { Router } from 'express';
import authenticate from '../../middleware/authenticate';
import { create, getAll, getById, update, remove } from './task.controller';

const router = Router();

router.use(authenticate);

router.post('/', create);
router.get('/', getAll);
router.get('/:id', getById);
router.put('/:id', update);
router.delete('/:id', remove);

export default router;
