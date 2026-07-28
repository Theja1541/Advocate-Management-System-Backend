const { Role, Module, Permission } = require('../features/associations');
const AppError = require('../utils/AppError');

/**
 * Middleware to authorize users based on dynamic database permissions
 * @param {string} moduleKey - Module keyCode (e.g. 'cases', 'diary', 'pay')
 * @param {string} action - Required privilege: 'V' (View), 'E' (Edit), 'A' (Approve)
 */
const authorizePermission = (moduleKey, action = 'V') => {
  return async (req, res, next) => {
    try {
      const userRoleName = req.user.role; // Set by 'protect' authentication middleware

      // 1. Fetch active Role and Module from DB
      const role = await Role.findOne({ where: { name: userRoleName } });
      const moduleObj = await Module.findOne({ where: { keyCode: moduleKey } });

      if (!role || !moduleObj) {
        return next(new AppError('Forbidden: Access control configuration missing.', 403));
      }

      // 2. Fetch privilege level
      const permission = await Permission.findOne({
        where: {
          roleId: role.id,
          moduleId: moduleObj.id
        }
      });

      const accessLevel = permission ? permission.accessLevel : '—';

      // 3. Verify privilege contains action code (e.g. 'VEA' contains 'E')
      if (!accessLevel.includes(action)) {
        return next(new AppError('Access Denied: You do not have permission to perform this operation.', 403));
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};

module.exports = authorizePermission;
