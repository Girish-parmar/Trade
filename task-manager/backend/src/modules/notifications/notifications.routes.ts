import { Router } from 'express';
import { requireAuth } from '../../middleware/auth';
import {
  listNotificationsHandler,
  markAllReadHandler,
  markReadHandler,
} from './notifications.controller';

const router = Router();

router.use(requireAuth);
router.get('/', listNotificationsHandler);
router.patch('/read-all', markAllReadHandler);
router.patch('/:id/read', markReadHandler);

export default router;
