const db = require('../models');

function serializeReference(row) {
  return { id: Number(row.id), name: row.name };
}

exports.listLocations = async (req, res) => {
  try {
    const locations = await db.Location.findAll({ order: [['id', 'ASC']] });
    return res.status(200).json({ locations: locations.map(serializeReference) });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

exports.listStockCategories = async (req, res) => {
  try {
    const stockCategories = await db.StockCategory.findAll({ order: [['id', 'ASC']] });
    return res.status(200).json({
      stock_categories: stockCategories.map(serializeReference),
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

exports.listReferences = async (req, res) => {
  try {
    const [locations, stockCategories] = await Promise.all([
      db.Location.findAll({ order: [['id', 'ASC']] }),
      db.StockCategory.findAll({ order: [['id', 'ASC']] }),
    ]);

    return res.status(200).json({
      locations: locations.map(serializeReference),
      stock_categories: stockCategories.map(serializeReference),
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};
