const express = require('express');
const auth = require('../middlewares/auth');
const { register, login, me, logout } = require('../controllers/auth.controller');

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.get('/me', auth, me);
router.post('/logout', auth, logout);

module.exports = router;
