const db = require('../models');

exports.createHouse = async (req, res) => {
  const t = await db.sequelize.transaction();
  try {
    const { name, type } = req.body ?? {};
    if (!name) return res.status(400).json({ error: 'name is required' });

    const userId = req.user.id;

    // 1) Create house
    const house = await db.House.create(
      { name, type: type || 'home', created_by: userId },
      { transaction: t }
    );

    // 2) Find role "owner"
    const ownerRole = await db.Role.findOne({ where: { name: 'owner' }, transaction: t });
    if (!ownerRole) {
      // Fallback (si tu n'as pas seed roles)
      // Tu peux aussi refuser et demander de seed roles :
      // throw new Error('Role "owner" not found. Seed roles first.');
      await t.rollback();
      return res.status(500).json({ error: 'Role "owner" not found. Seed roles first.' });
    }

    // 3) Create membership
    await db.HouseMember.create(
      { user_id: userId, house_id: house.id, role_id: ownerRole.id, joined_at: new Date() },
      { transaction: t }
    );

    await t.commit();
    return res.status(201).json(house);
  } catch (err) {
    await t.rollback();
    return res.status(500).json({ error: err.message });
  }
};

exports.deleteHouse = async (req, res) => {
  const t = await db.sequelize.transaction();
  try {
    const userId = req.user.id;
    const houseId = Number(req.params.houseId);

    if (!Number.isFinite(houseId)) {
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
      return res.status(403).json({ error: 'Only the house owner can delete this house' });
    }

    await house.destroy({ transaction: t });

    await t.commit();
    return res.status(200).json({ message: 'House deleted successfully' });
  } catch (err) {
    await t.rollback();
    return res.status(500).json({ error: err.message });
  }
};
