import { Router } from 'express';
import { prisma } from '../../lib/prisma';
import { validate } from '../../middleware/validate';
import { verifyProjectScoped } from '../../middleware/verifyProjectScoped';
import { createTagSchema, updateTagSchema } from './tags.schemas';
import {
  createTagHandler,
  deleteTagHandler,
  listTagsHandler,
  updateTagHandler,
} from './tags.controller';

const router = Router({ mergeParams: true });

router.param(
  'tagId',
  verifyProjectScoped((id) => prisma.tag.findUnique({ where: { id } }), 'Tag'),
);

router.get('/', listTagsHandler);
router.post('/', validate(createTagSchema), createTagHandler);
router.patch('/:tagId', validate(updateTagSchema), updateTagHandler);
router.delete('/:tagId', deleteTagHandler);

export default router;
