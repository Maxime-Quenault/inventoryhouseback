const express = require('express');
const auth = require('../middlewares/auth');
const { addItemToHouse, deleteItemFromHouse } = require('../controllers/item.controller');

const router = express.Router();

router.post('/houses/:houseId/items', auth, addItemToHouse);
router.delete('/houses/:houseId/items/:itemId', auth, deleteItemFromHouse);

module.exports = router;