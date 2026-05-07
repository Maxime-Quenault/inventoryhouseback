const db = require('../models');
const { toPositiveId, getMembership } = require('../services/access.service');

const { Op } = db.Sequelize;
const STOCK_ACTIONS = ['add', 'update', 'remove'];

const itemIncludes = [
  { model: db.StockCategory, attributes: ['id', 'name'] },
  { model: db.Location, attributes: ['id', 'name'] },
  { model: db.User, attributes: ['id', 'name', 'email'] },
];

function cleanText(value) {
  return typeof value === 'string' ? value.trim() : '';
}

function hasField(body, field) {
  return Object.prototype.hasOwnProperty.call(body ?? {}, field);
}

function parseQuantity(value, fieldName = 'quantity') {
  const quantity = Number(value);
  if (!Number.isInteger(quantity) || quantity < 0) {
    return { error: `${fieldName} must be a non-negative integer` };
  }

  return { value: quantity };
}

function parseDate(value) {
  if (value === null || value === '') return { value: null };

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return { error: 'expiration_date must be a valid ISO date or null' };
  }

  return { value: date };
}

function serializeItem(item) {
  const data = item.toJSON ? item.toJSON() : item;

  return {
    id: Number(data.id),
    house_id: Number(data.house_id),
    category_id: Number(data.category_id),
    location_id: Number(data.location_id),
    name: data.name,
    quantity: data.quantity,
    unit: data.unit,
    expiration_date: data.expiration_date,
    created_by: Number(data.created_by),
    created_at: data.created_at,
    updated_at: data.updated_at,
    deleted_at: data.deleted_at,
    category: data.StockCategory
      ? { id: Number(data.StockCategory.id), name: data.StockCategory.name }
      : null,
    location: data.Location
      ? { id: Number(data.Location.id), name: data.Location.name }
      : null,
    created_by_user: data.User
      ? { id: Number(data.User.id), name: data.User.name, email: data.User.email }
      : null,
  };
}

function serializeMovement(movement) {
  const data = movement.toJSON ? movement.toJSON() : movement;

  return {
    id: Number(data.id),
    item_id: Number(data.item_id),
    user_id: Number(data.user_id),
    house_id: Number(data.house_id),
    change_quantity: data.change_quantity,
    action: data.action,
    created_at: data.created_at,
    item: data.Item
      ? {
          id: Number(data.Item.id),
          name: data.Item.name,
          unit: data.Item.unit,
          deleted_at: data.Item.deleted_at,
        }
      : null,
    user: data.User
      ? {
          id: Number(data.User.id),
          name: data.User.name,
          email: data.User.email,
        }
      : null,
  };
}

async function ensureMembership(userId, houseId, transaction) {
  return getMembership(userId, houseId, { transaction });
}

async function ensureReferences(categoryId, locationId, transaction) {
  const [category, location] = await Promise.all([
    categoryId ? db.StockCategory.findByPk(categoryId, { transaction }) : null,
    locationId ? db.Location.findByPk(locationId, { transaction }) : null,
  ]);

  if (categoryId && !category) return { error: 'Invalid category_id' };
  if (locationId && !location) return { error: 'Invalid location_id' };

  return { category, location };
}

exports.listItemsInHouse = async (req, res) => {
  try {
    const houseId = toPositiveId(req.params.houseId);
    if (!houseId) return res.status(400).json({ error: 'Invalid houseId' });

    const membership = await ensureMembership(req.user.id, houseId);
    if (!membership) {
      return res.status(403).json({ error: 'You are not a member of this house' });
    }

    const where = { house_id: houseId };

    if (req.query.location_id) {
      const locationId = toPositiveId(req.query.location_id);
      if (!locationId) return res.status(400).json({ error: 'Invalid location_id' });
      where.location_id = locationId;
    }

    if (req.query.category_id) {
      const categoryId = toPositiveId(req.query.category_id);
      if (!categoryId) return res.status(400).json({ error: 'Invalid category_id' });
      where.category_id = categoryId;
    }

    if (req.query.search) {
      where.name = { [Op.iLike]: `%${String(req.query.search).trim()}%` };
    }

    if (req.query.updated_since) {
      const since = new Date(req.query.updated_since);
      if (Number.isNaN(since.getTime())) {
        return res.status(400).json({ error: 'updated_since must be a valid ISO date' });
      }
      where.updated_at = { [Op.gte]: since };
    }

    const items = await db.Item.findAll({
      where,
      include: itemIncludes,
      order: [['updated_at', 'DESC'], ['id', 'DESC']],
    });

    return res.status(200).json({ items: items.map(serializeItem) });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

exports.addItemToHouse = async (req, res) => {
  const userId = req.user.id;
  const houseId = toPositiveId(req.params.houseId);
  const categoryId = toPositiveId(req.body?.category_id);
  const locationId = toPositiveId(req.body?.location_id);
  const name = cleanText(req.body?.name);
  const unit = cleanText(req.body?.unit);
  const quantityResult = hasField(req.body, 'quantity')
    ? parseQuantity(req.body.quantity)
    : { value: 0 };
  const expirationResult = hasField(req.body, 'expiration_date')
    ? parseDate(req.body.expiration_date)
    : { value: null };

  if (!houseId) return res.status(400).json({ error: 'Invalid houseId' });
  if (!categoryId || !locationId || !name || !unit) {
    return res.status(400).json({ error: 'category_id, location_id, name and unit are required' });
  }
  if (quantityResult.error) return res.status(400).json({ error: quantityResult.error });
  if (expirationResult.error) return res.status(400).json({ error: expirationResult.error });

  const t = await db.sequelize.transaction();
  try {
    const membership = await ensureMembership(userId, houseId, t);

    if (!membership) {
      await t.rollback();
      return res.status(403).json({ error: 'You are not a member of this house' });
    }

    const references = await ensureReferences(categoryId, locationId, t);
    if (references.error) {
      await t.rollback();
      return res.status(400).json({ error: references.error });
    }

    const item = await db.Item.create({
      house_id: houseId,
      category_id: categoryId,
      name,
      quantity: quantityResult.value,
      unit,
      expiration_date: expirationResult.value,
      created_by: userId,
      location_id: locationId,
    }, { transaction: t });

    await db.StockMovement.create({
      item_id: item.id,
      user_id: userId,
      house_id: houseId,
      change_quantity: quantityResult.value,
      action: 'add',
      created_at: new Date(),
    }, { transaction: t });

    const createdItem = await db.Item.findByPk(item.id, {
      include: itemIncludes,
      transaction: t,
    });

    await t.commit();
    return res.status(201).json({ item: serializeItem(createdItem) });
  } catch (err) {
    await t.rollback();
    return res.status(500).json({ error: err.message });
  }
};

exports.getItemInHouse = async (req, res) => {
  try {
    const userId = req.user.id;
    const houseId = toPositiveId(req.params.houseId);
    const itemId = toPositiveId(req.params.itemId);

    if (!houseId || !itemId) {
      return res.status(400).json({ error: 'Invalid houseId or itemId' });
    }

    const membership = await ensureMembership(userId, houseId);
    if (!membership) {
      return res.status(403).json({ error: 'You are not a member of this house' });
    }

    const item = await db.Item.findOne({
      where: { id: itemId, house_id: houseId },
      include: itemIncludes,
    });

    if (!item) return res.status(404).json({ error: 'Item not found in this house' });

    return res.status(200).json({ item: serializeItem(item) });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

exports.updateItemInHouse = async (req, res) => {
  const userId = req.user.id;
  const houseId = toPositiveId(req.params.houseId);
  const itemId = toPositiveId(req.params.itemId);
  const body = req.body ?? {};
  const updates = {};

  if (!houseId || !itemId) {
    return res.status(400).json({ error: 'Invalid houseId or itemId' });
  }

  if (hasField(body, 'name')) {
    const name = cleanText(body.name);
    if (!name) return res.status(400).json({ error: 'name must be a non-empty string' });
    updates.name = name;
  }

  if (hasField(body, 'unit')) {
    const unit = cleanText(body.unit);
    if (!unit) return res.status(400).json({ error: 'unit must be a non-empty string' });
    updates.unit = unit;
  }

  if (hasField(body, 'quantity')) {
    const quantityResult = parseQuantity(body.quantity);
    if (quantityResult.error) return res.status(400).json({ error: quantityResult.error });
    updates.quantity = quantityResult.value;
  }

  if (hasField(body, 'expiration_date')) {
    const expirationResult = parseDate(body.expiration_date);
    if (expirationResult.error) return res.status(400).json({ error: expirationResult.error });
    updates.expiration_date = expirationResult.value;
  }

  if (hasField(body, 'category_id')) {
    const categoryId = toPositiveId(body.category_id);
    if (!categoryId) return res.status(400).json({ error: 'Invalid category_id' });
    updates.category_id = categoryId;
  }

  if (hasField(body, 'location_id')) {
    const locationId = toPositiveId(body.location_id);
    if (!locationId) return res.status(400).json({ error: 'Invalid location_id' });
    updates.location_id = locationId;
  }

  if (Object.keys(updates).length === 0) {
    return res.status(400).json({ error: 'No valid field to update' });
  }

  const t = await db.sequelize.transaction();
  try {
    const membership = await ensureMembership(userId, houseId, t);

    if (!membership) {
      await t.rollback();
      return res.status(403).json({ error: 'You are not a member of this house' });
    }

    const item = await db.Item.findOne({
      where: { id: itemId, house_id: houseId },
      transaction: t,
    });

    if (!item) {
      await t.rollback();
      return res.status(404).json({ error: 'Item not found in this house' });
    }

    const references = await ensureReferences(updates.category_id, updates.location_id, t);
    if (references.error) {
      await t.rollback();
      return res.status(400).json({ error: references.error });
    }

    const previousQuantity = Number(item.quantity || 0);
    const nextQuantity = hasField(updates, 'quantity') ? updates.quantity : previousQuantity;
    const changeQuantity = nextQuantity - previousQuantity;

    await item.update(updates, { transaction: t });

    await db.StockMovement.create({
      item_id: item.id,
      user_id: userId,
      house_id: houseId,
      change_quantity: changeQuantity,
      action: 'update',
      created_at: new Date(),
    }, { transaction: t });

    const updatedItem = await db.Item.findByPk(item.id, {
      include: itemIncludes,
      transaction: t,
    });

    await t.commit();
    return res.status(200).json({ item: serializeItem(updatedItem) });
  } catch (err) {
    await t.rollback();
    return res.status(500).json({ error: err.message });
  }
};

exports.deleteItemFromHouse = async (req, res) => {
  const userId = req.user.id;
  const houseId = toPositiveId(req.params.houseId);
  const itemId = toPositiveId(req.params.itemId);

  if (!houseId || !itemId) {
    return res.status(400).json({ error: 'Invalid houseId or itemId' });
  }

  const t = await db.sequelize.transaction();
  try {
    const membership = await ensureMembership(userId, houseId, t);

    if (!membership) {
      await t.rollback();
      return res.status(403).json({ error: 'You are not a member of this house' });
    }

    const item = await db.Item.findOne({
      where: { id: itemId, house_id: houseId },
      transaction: t,
    });

    if (!item) {
      await t.rollback();
      return res.status(404).json({ error: 'Item not found in this house' });
    }

    await db.StockMovement.create({
      item_id: item.id,
      user_id: userId,
      house_id: houseId,
      change_quantity: -Math.abs(item.quantity || 0),
      action: 'remove',
      created_at: new Date(),
    }, { transaction: t });

    await item.destroy({ transaction: t });

    await t.commit();
    return res.status(200).json({ message: 'Item deleted successfully' });
  } catch (err) {
    await t.rollback();
    return res.status(500).json({ error: err.message });
  }
};

exports.listStockMovements = async (req, res) => {
  try {
    const houseId = toPositiveId(req.params.houseId);
    if (!houseId) return res.status(400).json({ error: 'Invalid houseId' });

    const membership = await ensureMembership(req.user.id, houseId);
    if (!membership) {
      return res.status(403).json({ error: 'You are not a member of this house' });
    }

    const where = { house_id: houseId };

    if (req.query.since) {
      const since = new Date(req.query.since);
      if (Number.isNaN(since.getTime())) {
        return res.status(400).json({ error: 'since must be a valid ISO date' });
      }
      where.created_at = { [Op.gte]: since };
    }

    if (req.query.action) {
      const action = String(req.query.action).trim().toLowerCase();
      if (!STOCK_ACTIONS.includes(action)) {
        return res.status(400).json({ error: 'action must be add, update or remove' });
      }
      where.action = action;
    }

    const requestedLimit = req.query.limit ? Number(req.query.limit) : 50;
    const limit = Math.min(Math.max(Number.isInteger(requestedLimit) ? requestedLimit : 50, 1), 200);

    const movements = await db.StockMovement.findAll({
      where,
      include: [
        {
          model: db.Item,
          attributes: ['id', 'name', 'unit', 'deleted_at'],
          paranoid: false,
        },
        { model: db.User, attributes: ['id', 'name', 'email'] },
      ],
      order: [['created_at', 'DESC'], ['id', 'DESC']],
      limit,
    });

    return res.status(200).json({
      stock_movements: movements.map(serializeMovement),
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};
