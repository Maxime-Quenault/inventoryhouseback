const express = require('express');
const auth = require('../middlewares/auth');
const {
  listMembers,
  addMember,
  updateMemberRole,
  removeMember,
} = require('../controllers/member.controller');

const router = express.Router();

router.get('/houses/:houseId/members', auth, listMembers);
router.post('/houses/:houseId/members', auth, addMember);
router.patch('/houses/:houseId/members/:userId', auth, updateMemberRole);
router.delete('/houses/:houseId/members/:userId', auth, removeMember);

module.exports = router;
