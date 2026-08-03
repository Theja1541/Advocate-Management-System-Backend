const { Role, Module, Permission } = require('../features/associations');

/**
 * Checks if a specific role has the required permission action for a given module.
 *
 * @param {string} userRoleName - The name of the user's role.
 * @param {string} moduleKey - The unique key identifying the module.
 * @param {string} action - The action to check ('V', 'E', 'A').
 * @returns {Promise<boolean>} - True if permission is granted, otherwise false.
 */
const checkPermission = async (userRoleName, moduleKey, action = 'V') => {
  const role = await Role.findOne({ where: { name: userRoleName } });
  const moduleObj = await Module.findOne({ where: { keyCode: moduleKey } });

  if (!role || !moduleObj) return false;

  const permission = await Permission.findOne({
    where: {
      roleId: role.id,
      moduleId: moduleObj.id
    }
  });

  const accessLevel = permission ? permission.accessLevel : '—';
  return accessLevel.includes(action);
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
