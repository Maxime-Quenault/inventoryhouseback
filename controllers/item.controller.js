const db = require('../models');

exports.addItemToHouse = async (req, res) => {
  const t = await db.sequelize.transaction();
  try {
    const userId = req.user.id;
    const houseId = Number(req.params.houseId);

    if (!Number.isFinite(houseId)) {
      return res.status(400).json({ error: 'Invalid houseId' });
    }

    const {
      category_id,
      name,
      quantity,
      unit,
      expiration_date,
    } = req.body ?? {};

    if (!category_id || !name || unit == null) {
      return res.status(400).json({ error: 'category_id, name, unit are required' });
    }

    const qty = Number.isFinite(Number(quantity)) ? Number(quantity) : 0;

    // 1) Membership check
    const membership = await db.HouseMember.findOne({
      where: { user_id: userId, house_id: houseId },
      transaction: t,
    });

    if (!membership) {
      await t.rollback();
      return res.status(403).json({ error: 'You are not a member of this house' });
    }

    // 2) Create item
    const item = await db.Item.create({
      house_id: houseId,
      category_id,
      name,
      quantity: qty,
      unit,
      expiration_date: expiration_date ? new Date(expiration_date) : null,
      created_by: userId,
    }, { transaction: t });

    // 3) Create stock movement (recommended)
    await db.StockMovement.create({
      item_id: item.id,
      user_id: userId,
      house_id: houseId,       // si tu as gardé house_id dans stock_movements
      change_quantity: qty,
      action: 'add',
      created_at: new Date(),
    }, { transaction: t });

    await t.commit();
    return res.status(201).json(item);
  } catch (err) {
    await t.rollback();
    return res.status(500).json({ error: err.message });
  }
};