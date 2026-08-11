import { Router } from 'express';
import { prisma } from '../../lib/prisma';
import { validate } from '../../middleware/validate';
import { verifyProjectScoped } from '../../middleware/verifyProjectScoped';
import {
  createTemplateSchema,
  instantiateTemplateSchema,
  updateTemplateSchema,
} from './templates.schemas';
import {
  createTemplateHandler,
  deleteTemplateHandler,
  getTemplateHandler,
  instantiateTemplateHandler,
  listTemplatesHandler,
  updateTemplateHandler,
} from './templates.controller';

const router = Router({ mergeParams: true });

router.param(
  'templateId',
  verifyProjectScoped((id) => prisma.taskTemplate.findUnique({ where: { id } }), 'Template'),
);

router.get('/', listTemplatesHandler);
router.post('/', validate(createTemplateSchema), createTemplateHandler);
router.get('/:templateId', getTemplateHandler);
router.patch('/:templateId', validate(updateTemplateSchema), updateTemplateHandler);
router.delete('/:templateId', deleteTemplateHandler);
router.post(
  '/:templateId/instantiate',
  validate(instantiateTemplateSchema),
  instantiateTemplateHandler,
);

export default router;
