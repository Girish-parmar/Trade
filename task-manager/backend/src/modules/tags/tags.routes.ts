import { Router } from 'express';
import { validate } from '../../middleware/validate';
import { createTagSchema, updateTagSchema } from './tags.schemas';
import {
  createTagHandler,
  deleteTagHandler,
  listTagsHandler,
  updateTagHandler,
} from './tags.controller';

const router = Router({ mergeParams: true });

router.get('/', listTagsHandler);
router.post('/', validate(createTagSchema), createTagHandler);
router.patch('/:tagId', validate(updateTagSchema), updateTagHandler);
router.delete('/:tagId', deleteTagHandler);

export default router;
