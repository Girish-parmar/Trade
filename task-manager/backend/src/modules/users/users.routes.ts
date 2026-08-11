import { Router } from 'express';
import { requireAuth } from '../../middleware/auth';
import { searchUsersHandler } from './users.controller';

const router = Router();

router.get('/search', requireAuth, searchUsersHandler);

export default router;
