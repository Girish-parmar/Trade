import { Router } from 'express';
import { requireAuth } from '../../middleware/auth';
import { requireProjectMember } from '../../middleware/requireProjectMember';
import { validate } from '../../middleware/validate';
import { createProjectSchema, updateProjectSchema } from './projects.schemas';
import {
  createProjectHandler,
  deleteProjectHandler,
  getProjectHandler,
  listProjectsHandler,
  updateProjectHandler,
} from './projects.controller';
import membersRouter from '../members/members.routes';
import tagsRouter from '../tags/tags.routes';
import tasksRouter from '../tasks/tasks.routes';
import templatesRouter from '../templates/templates.routes';

const router = Router();

router.use(requireAuth);

router.get('/', listProjectsHandler);
router.post('/', validate(createProjectSchema), createProjectHandler);
router.get('/:projectId', requireProjectMember('MEMBER'), getProjectHandler);
router.patch(
  '/:projectId',
  requireProjectMember('ADMIN'),
  validate(updateProjectSchema),
  updateProjectHandler,
);
router.delete('/:projectId', requireProjectMember('OWNER'), deleteProjectHandler);

router.use('/:projectId/members', requireProjectMember('MEMBER'), membersRouter);
router.use('/:projectId/tags', requireProjectMember('MEMBER'), tagsRouter);
router.use('/:projectId/tasks', requireProjectMember('MEMBER'), tasksRouter);
router.use('/:projectId/templates', requireProjectMember('MEMBER'), templatesRouter);

export default router;
