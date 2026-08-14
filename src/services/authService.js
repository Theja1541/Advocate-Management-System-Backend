const { Role, Module, Permission } = require('../features/associations');
const { isSuperAdmin, isTenantAdmin, isGroupAdmin, normalizeRole } = require('../utils/roleHelper');

/**
 * Checks if a specific role has the required permission action for a given module.
 *
 * @param {string} userRoleName - The name of the user's role.
 * @param {string} moduleKey - The unique key identifying the module.
 * @param {string} action - The action to check ('V', 'E', 'A').
 * @returns {Promise<boolean>} - True if permission is granted, otherwise false.
 */
const checkPermission = async (userRoleName, moduleKey, action = 'V', roleId = null) => {
  const normRole = normalizeRole(userRoleName);
  if (normRole === 'Super Admin') return true;

  if (normRole === 'Tenant Admin' && ['tenants', 'plans'].includes(moduleKey)) {
    return false;
  }

  if (normRole === 'Group Admin' && ['tenants', 'plans', 'tenantSettings', 'group-admins', 'member'].includes(moduleKey)) {
    return false;
  }

  let targetRoleName = normRole;
  if (normRole === 'Group Admin') {
    targetRoleName = 'Tenant Admin';
  }

  let role = null;
  // If we are Group Admin, we must ignore the passed roleId and fetch Tenant Admin's role
  if (roleId != null && normRole !== 'Group Admin') {
    role = await Role.findByPk(roleId);
  }
  if (!role && targetRoleName) {
    // Note: This fetches the role name globally. In a multi-tenant DB, Tenant Admin is unique per tenant if roles are duplicated, but usually roles are global or linked properly.
    role = await Role.findOne({ where: { name: targetRoleName } });
  }

  const moduleObj = await Module.findOne({ where: { keyCode: moduleKey } });

  if (!role || !moduleObj) return false;

  const permission = await Permission.findOne({
    where: {
      roleId: role.id,
      moduleId: moduleObj.id
    }
  });

  const accessLevel = permission ? permission.accessLevel : '---';
  return typeof accessLevel === 'string' && accessLevel.includes(action);
};


/**
 * Retrieves all module keys that a specific role has a certain permission for.
 * Useful for preventing N+1 queries when building broad filters.
 *
 * @param {string} userRoleName - The name of the user's role.
 * @param {string} action - The action to check ('V', 'E', 'A').
 * @returns {Promise<string[]>} - Array of authorized module keys.
 */
const getAuthorizedModules = async (userRoleName, action = 'V') => {
  const role = await Role.findOne({ where: { name: userRoleName } });
  if (!role) return [];

  const permissions = await Permission.findAll({ where: { roleId: role.id } });
  const authorizedModuleIds = permissions
    .filter(p => p.accessLevel.includes(action))
    .map(p => p.moduleId);

  if (authorizedModuleIds.length === 0) return [];

  const modules = await Module.findAll({ where: { id: authorizedModuleIds } });
  return modules.map(m => m.keyCode);
};

module.exports = {
  checkPermission,
  getAuthorizedModules
};
