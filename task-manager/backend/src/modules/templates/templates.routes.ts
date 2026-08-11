import { Router } from 'express';
import { validate } from '../../middleware/validate';
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
