const db = require('../models');
const {
  toPositiveId,
  getMembership,
  requireHouseManager,
  getRoleName,
} = require('../services/access.service');

const ASSIGNABLE_ROLES = ['member', 'admin'];

function normalizeEmail(email) {
  return typeof email === 'string' ? email.trim().toLowerCase() : '';
}

function emailWhere(email) {
  return db.sequelize.where(db.sequelize.fn('lower', db.sequelize.col('email')), email);
}

function serializeMember(membership) {
  return {
    user_id: Number(membership.user_id),
    house_id: Number(membership.house_id),
    joined_at: membership.joined_at,
    role: membership.Role
      ? { id: Number(membership.Role.id), name: membership.Role.name }
      : null,
    user: membership.User
      ? {
          id: Number(membership.User.id),
          name: membership.User.name,
          email: membership.User.email,
        }
      : null,
  };
}

async function findAssignableRole(roleName, transaction) {
  if (!ASSIGNABLE_ROLES.includes(roleName)) return null;

  return db.Role.findOne({
    where: { name: roleName },
    transaction,
  });
}

exports.listMembers = async (req, res) => {
  try {
    const houseId = toPositiveId(req.params.houseId);
    if (!houseId) return res.status(400).json({ error: 'Invalid houseId' });

    const membership = await getMembership(req.user.id, houseId);
    if (!membership) {
      return res.status(403).json({ error: 'You are not a member of this house' });
    }

    const members = await db.HouseMember.findAll({
      where: { house_id: houseId },
      include: [
        { model: db.User, attributes: ['id', 'name', 'email'] },
        { model: db.Role, attributes: ['id', 'name'] },
      ],
      order: [['joined_at', 'ASC']],
    });

    return res.status(200).json({ members: members.map(serializeMember) });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

exports.addMember = async (req, res) => {
  const houseId = toPositiveId(req.params.houseId);
  const email = normalizeEmail(req.body?.email);
  const roleName = req.body?.role ? String(req.body.role).trim().toLowerCase() : 'member';

  if (!houseId) return res.status(400).json({ error: 'Invalid houseId' });
  if (!email) return res.status(400).json({ error: 'email is required' });
  if (!ASSIGNABLE_ROLES.includes(roleName)) {
    return res.status(400).json({ error: 'role must be member or admin' });
  }

  const t = await db.sequelize.transaction();
  try {
    const manager = await requireHouseManager(req.user.id, houseId, { transaction: t });
    if (!manager) {
      await t.rollback();
      return res.status(403).json({ error: 'Only an owner or admin can add members' });
    }

    const user = await db.User.findOne({ where: emailWhere(email), transaction: t });
    if (!user) {
      await t.rollback();
      return res.status(404).json({ error: 'User not found. The member must create an account first.' });
    }

    const existingMembership = await db.HouseMember.findOne({
      where: { user_id: user.id, house_id: houseId },
      transaction: t,
    });
    if (existingMembership) {
      await t.rollback();
      return res.status(409).json({ error: 'User is already a member of this house' });
    }

    const role = await findAssignableRole(roleName, t);
    if (!role) {
      await t.rollback();
      return res.status(500).json({ error: `Role "${roleName}" not found. Seed roles first.` });
    }

    const membership = await db.HouseMember.create(
      {
        user_id: user.id,
        house_id: houseId,
        role_id: role.id,
        joined_at: new Date(),
      },
      { transaction: t }
    );

    membership.User = user;
    membership.Role = role;

    await t.commit();
    return res.status(201).json({ member: serializeMember(membership) });
  } catch (err) {
    await t.rollback();
    return res.status(500).json({ error: err.message });
  }
};

exports.updateMemberRole = async (req, res) => {
  const houseId = toPositiveId(req.params.houseId);
  const userId = toPositiveId(req.params.userId);
  const roleName = req.body?.role ? String(req.body.role).trim().toLowerCase() : '';

  if (!houseId || !userId) return res.status(400).json({ error: 'Invalid houseId or userId' });
  if (!ASSIGNABLE_ROLES.includes(roleName)) {
    return res.status(400).json({ error: 'role must be member or admin' });
  }

  const t = await db.sequelize.transaction();
  try {
    const manager = await requireHouseManager(req.user.id, houseId, { transaction: t });
    if (!manager) {
      await t.rollback();
      return res.status(403).json({ error: 'Only an owner or admin can update members' });
    }

    const targetMembership = await db.HouseMember.findOne({
      where: { user_id: userId, house_id: houseId },
      include: [
        { model: db.User, attributes: ['id', 'name', 'email'] },
        { model: db.Role, attributes: ['id', 'name'] },
      ],
      transaction: t,
    });

    if (!targetMembership) {
      await t.rollback();
      return res.status(404).json({ error: 'Member not found in this house' });
    }

    if (getRoleName(targetMembership) === 'owner') {
      await t.rollback();
      return res.status(400).json({ error: 'Owner role cannot be changed from this endpoint' });
    }

    const role = await findAssignableRole(roleName, t);
    if (!role) {
      await t.rollback();
      return res.status(500).json({ error: `Role "${roleName}" not found. Seed roles first.` });
    }

    await targetMembership.update({ role_id: role.id }, { transaction: t });
    targetMembership.Role = role;

    await t.commit();
    return res.status(200).json({ member: serializeMember(targetMembership) });
  } catch (err) {
    await t.rollback();
    return res.status(500).json({ error: err.message });
  }
};

exports.removeMember = async (req, res) => {
  const houseId = toPositiveId(req.params.houseId);
  const userId = toPositiveId(req.params.userId);

  if (!houseId || !userId) return res.status(400).json({ error: 'Invalid houseId or userId' });

  const t = await db.sequelize.transaction();
  try {
    const manager = await requireHouseManager(req.user.id, houseId, { transaction: t });
    if (!manager) {
      await t.rollback();
      return res.status(403).json({ error: 'Only an owner or admin can remove members' });
    }

    const targetMembership = await db.HouseMember.findOne({
      where: { user_id: userId, house_id: houseId },
      include: [{ model: db.Role, attributes: ['id', 'name'] }],
      transaction: t,
    });

    if (!targetMembership) {
      await t.rollback();
      return res.status(404).json({ error: 'Member not found in this house' });
    }

    if (getRoleName(targetMembership) === 'owner') {
      await t.rollback();
      return res.status(400).json({ error: 'Owner cannot be removed from this endpoint' });
    }

    await targetMembership.destroy({ transaction: t });

    await t.commit();
    return res.status(200).json({ message: 'Member removed successfully' });
  } catch (err) {
    await t.rollback();
    return res.status(500).json({ error: err.message });
  }
};
