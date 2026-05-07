const db = require('../models');

const MANAGER_ROLES = ['owner', 'admin'];

function toPositiveId(value) {
  const id = Number(value);
  return Number.isInteger(id) && id > 0 ? id : null;
}

function getRoleName(membership) {
  return membership?.Role?.name || null;
}

function canManageHouse(membership) {
  return MANAGER_ROLES.includes(getRoleName(membership));
}

async function getMembership(userId, houseId, options = {}) {
  return db.HouseMember.findOne({
    where: { user_id: userId, house_id: houseId },
    include: [{ model: db.Role, attributes: ['id', 'name'] }],
    transaction: options.transaction,
  });
}

async function requireHouseManager(userId, houseId, options = {}) {
  const membership = await getMembership(userId, houseId, options);
  return canManageHouse(membership) ? membership : null;
}

module.exports = {
  MANAGER_ROLES,
  toPositiveId,
  getRoleName,
  canManageHouse,
  getMembership,
  requireHouseManager,
};
