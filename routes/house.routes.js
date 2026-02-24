const express = require('express');
const auth = require('../middlewares/auth');
const { createHouse, deleteHouse } = require('../controllers/house.controller');

const router = express.Router();

router.post('/', auth, createHouse);
router.delete('/:houseId', auth, deleteHouse);

module.exports = router;