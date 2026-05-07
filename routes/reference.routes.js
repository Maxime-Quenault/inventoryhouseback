const express = require('express');
const {
  listReferences,
  listLocations,
  listStockCategories,
} = require('../controllers/reference.controller');

const router = express.Router();

router.get('/references', listReferences);
router.get('/locations', listLocations);
router.get('/stock-categories', listStockCategories);

module.exports = router;
