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