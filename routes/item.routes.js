const express = require('express');
const auth = require('../middlewares/auth');
const {
  listItemsInHouse,
  addItemToHouse,
  getItemInHouse,
  updateItemInHouse,
  deleteItemFromHouse,
  listStockMovements,
} = require('../controllers/item.controller');

const router = express.Router();

router.get('/houses/:houseId/items', auth, listItemsInHouse);
router.post('/houses/:houseId/items', auth, addItemToHouse);
router.get('/houses/:houseId/items/:itemId', auth, getItemInHouse);
router.patch('/houses/:houseId/items/:itemId', auth, updateItemInHouse);
router.delete('/houses/:houseId/items/:itemId', auth, deleteItemFromHouse);
router.get('/houses/:houseId/stock-movements', auth, listStockMovements);

module.exports = router;
