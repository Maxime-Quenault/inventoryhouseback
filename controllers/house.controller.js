const db = require('../models');
const {
  toPositiveId,
  getMembership,
  requireHouseManager,
  getRoleName,
} = require('../services/access.service');

function cleanText(value) {
  return typeof value === 'string' ? value.trim() : '';
}

function serializeHouse(house, membership, counts = {}) {
  return {
    id: Number(house.id),
    name: house.name,
    type: house.type,
    created_by: Number(house.created_by),
    created_at: house.created_at,
    updated_at: house.updated_at,
    role: getRoleName(membership),
    joined_at: membership?.joined_at,
    counts,
  };
}

exports.listHouses = async (req, res) => {
  try {
    const memberships = await db.HouseMember.findAll({
      where: { user_id: req.user.id },
      include: [
        { model: db.House },
        { model: db.Role, attributes: ['id', 'name'] },
      ],
      order: [['joined_at', 'DESC']],
    });

    return res.status(200).json({
      houses: memberships
        .filter((membership) => membership.House)
        .map((membership) => serializeHouse(membership.House, membership)),
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

exports.createHouse = async (req, res) => {
  const name = cleanText(req.body?.name);
  const type = cleanText(req.body?.type) || 'home';

  if (!name) return res.status(400).json({ error: 'name is required' });

  const t = await db.sequelize.transaction();
  try {
    const userId = req.user.id;

    const house = await db.House.create(
      { name, type, created_by: userId },
      { transaction: t }
    );

    const ownerRole = await db.Role.findOne({
      where: { name: 'owner' },
      transaction: t,
    });

    if (!ownerRole) {
      await t.rollback();
      return res.status(500).json({ error: 'Role "owner" not found. Seed roles first.' });
    }

    const membership = await db.HouseMember.create(
      { user_id: userId, house_id: house.id, role_id: ownerRole.id, joined_at: new Date() },
      { transaction: t }
    );

    membership.Role = ownerRole;

    await t.commit();
    return res.status(201).json({ house: serializeHouse(house, membership) });
  } catch (err) {
    await t.rollback();
    return res.status(500).json({ error: err.message });
  }
};

exports.getHouse = async (req, res) => {
  try {
    const userId = req.user.id;
    const houseId = toPositiveId(req.params.houseId);

    if (!houseId) return res.status(400).json({ error: 'Invalid houseId' });

    const membership = await getMembership(userId, houseId);
    if (!membership) {
      return res.status(403).json({ error: 'You are not a member of this house' });
    }

    const house = await db.House.findByPk(houseId);
    if (!house) return res.status(404).json({ error: 'House not found' });

    const [members, items] = await Promise.all([
      db.HouseMember.count({ where: { house_id: houseId } }),
      db.Item.count({ where: { house_id: houseId } }),
    ]);

    return res.status(200).json({
      house: serializeHouse(house, membership, { members, items }),
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

exports.updateHouse = async (req, res) => {
  try {
    const userId = req.user.id;
    const houseId = toPositiveId(req.params.houseId);

    if (!houseId) return res.status(400).json({ error: 'Invalid houseId' });

    const membership = await requireHouseManager(userId, houseId);
    if (!membership) {
      return res.status(403).json({ error: 'Only an owner or admin can update this house' });
    }

    const house = await db.House.findByPk(houseId);
    if (!house) return res.status(404).json({ error: 'House not found' });

    const updates = {};
    if (Object.prototype.hasOwnProperty.call(req.body ?? {}, 'name')) {
      const name = cleanText(req.body.name);
      if (!name) return res.status(400).json({ error: 'name must be a non-empty string' });
      updates.name = name;
    }
    if (Object.prototype.hasOwnProperty.call(req.body ?? {}, 'type')) {
      const type = cleanText(req.body.type);
      if (!type) return res.status(400).json({ error: 'type must be a non-empty string' });
      updates.type = type;
    }

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ error: 'No valid field to update' });
    }

    await house.update(updates);

    return res.status(200).json({ house: serializeHouse(house, membership) });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

exports.deleteHouse = async (req, res) => {
  const t = await db.sequelize.transaction();
  try {
    const userId = req.user.id;
    const houseId = toPositiveId(req.params.houseId);

    if (!houseId) {
      await t.rollback();
      return res.status(400).json({ error: 'Invalid houseId' });
    }

    const house = await db.House.findByPk(houseId, { transaction: t });

    if (!house) {
      await t.rollback();
      return res.status(404).json({ error: 'House not found' });
    }

    if (Number(house.created_by) !== Number(userId)) {
      await t.rollback();
      return res.status(403).json({ error: 'Only the house creator can delete this house' });
    }

    await house.destroy({ transaction: t });

    await t.commit();
    return res.status(200).json({ message: 'House deleted successfully' });
  } catch (err) {
    await t.rollback();
    return res.status(500).json({ error: err.message });
  }
};
