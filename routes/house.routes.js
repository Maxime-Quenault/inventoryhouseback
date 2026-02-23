const express = require('express');
const auth = require('../middlewares/auth');
const { createHouse } = require('../controllers/house.controller');

const router = express.Router();

router.post('/', auth, createHouse);

module.exports = router;