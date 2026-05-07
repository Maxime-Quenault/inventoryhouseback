const express = require('express');
const auth = require('../middlewares/auth');
const {
  listHouses,
  createHouse,
  getHouse,
  updateHouse,
  deleteHouse,
} = require('../controllers/house.controller');

const router = express.Router();

router.get('/', auth, listHouses);
router.post('/', auth, createHouse);
router.get('/:houseId', auth, getHouse);
router.patch('/:houseId', auth, updateHouse);
router.delete('/:houseId', auth, deleteHouse);

module.exports = router;
