const { Op } = require('sequelize');
const { User, Role } = require('../features/associations');
const { isTenantAdmin, isGroupAdmin } = require('./roleHelper');

const getGroupAdminIdsToExclude = async (currentUser) => {
  if (!isTenantAdmin(currentUser.role)) return [];
  const gaRole = await Role.findOne({ where: { name: 'Group Admin', tenantId: currentUser.tenantId } });
  if (!gaRole) return [];
  const gaUsers = await User.findAll({ where: { roleId: gaRole.id, tenantId: currentUser.tenantId } });
  return gaUsers.map(u => u.id);
};

const applyGroupAdminIsolation = async (whereClause, currentUser, createdByField = 'createdBy') => {
  const role = currentUser?.role || currentUser?.rawRole;
  if (isGroupAdmin(role)) {
    whereClause[createdByField] = currentUser.id;
  } else if (isTenantAdmin(role)) {
    const excludeIds = await getGroupAdminIdsToExclude(currentUser);
    if (excludeIds.length > 0) {
      whereClause[Op.and] = whereClause[Op.and] || [];
      whereClause[Op.and].push({
        [Op.or]: [
          { [createdByField]: { [Op.notIn]: excludeIds } },
          { [createdByField]: null }
        ]
      });
    }
  }
};

module.exports = { getGroupAdminIdsToExclude, applyGroupAdminIsolation };