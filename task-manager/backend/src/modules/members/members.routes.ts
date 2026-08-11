import { Router } from 'express';
import { validate } from '../../middleware/validate';
import { requireProjectMember } from '../../middleware/requireProjectMember';
import { addMemberSchema, updateMemberSchema } from './members.schemas';
import {
  addMemberHandler,
  listMembersHandler,
  removeMemberHandler,
  updateMemberHandler,
} from './members.controller';

const router = Router({ mergeParams: true });

router.get('/', listMembersHandler);
router.post('/', requireProjectMember('ADMIN'), validate(addMemberSchema), addMemberHandler);
router.patch(
  '/:memberId',
  requireProjectMember('ADMIN'),
  validate(updateMemberSchema),
  updateMemberHandler,
);
router.delete('/:memberId', requireProjectMember('ADMIN'), removeMemberHandler);

export default router;
