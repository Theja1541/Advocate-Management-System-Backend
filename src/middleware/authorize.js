const AppError = require('../utils/AppError');
const { checkPermission } = require('../services/authService');

/**
 * Middleware to authorize users based on dynamic database permissions
 * @param {string} moduleKey - Module keyCode (e.g. 'cases', 'diary', 'pay')
 * @param {string} action - Required privilege: 'V' (View), 'E' (Edit), 'A' (Approve)
 */
const authorizePermission = (moduleKey, action = 'V') => {
  return async (req, res, next) => {
    try {
      const userRoleName = req.user.role; // Set by 'protect' authentication middleware
      const roleId = req.user.roleId;
      
      // Enforce strict Read-Only access for Advocates (Removed to support dynamic permissions)

      const isAuthorized = await checkPermission(userRoleName, moduleKey, action, roleId);

      if (!isAuthorized) {
        return next(new AppError('Access Denied: You do not have permission to perform this operation.', 403));
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};

module.exports = authorizePermission;
