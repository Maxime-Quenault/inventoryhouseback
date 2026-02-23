const express = require('express');
const auth = require('../middlewares/auth');
const { addItemToHouse } = require('../controllers/item.controller');

const router = express.Router();

router.post('/houses/:houseId/items', auth, addItemToHouse);

module.exports = router;