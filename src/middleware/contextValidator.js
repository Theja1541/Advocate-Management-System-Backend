const AppError = require('../utils/AppError');
const { Advocate, GroupAdminAdvocate } = require('../features/associations');
const { isAdvocate } = require('../utils/roleHelper');

const validateAdminContext = async (req, res, next) => {
  try {
    const user = req.user;
    if (!user) return next(); // Skip if not logged in

    if (!isAdvocate(user.role)) {
      // Non-advocates use their own context inherently
      return next();
    }

    let contextType = req.headers['x-admin-context-type'];
    let contextId = req.headers['x-admin-context-id'];

    if (!user.advocateId) {
      return next(new AppError('Advocate profile not found for user', 403));
    }

    if (!contextType || !contextId) {
      // Fallback: If frontend didn't send headers, try to pick the first available context
      const advocate = await Advocate.findByPk(user.advocateId, {
        attributes: ['tenantAdminId', 'tenantId']
      });
      if (!advocate) {
        return next(new AppError('Advocate profile not found for user', 403));
      }
      
      const groupLinks = await GroupAdminAdvocate.findAll({
        where: { advocateId: user.advocateId }
      });

      const available = [];
      if (advocate.tenantAdminId) {
        available.push({ type: 'TENANT_ADMIN', id: advocate.tenantAdminId });
      }
      if (groupLinks && groupLinks.length > 0) {
        groupLinks.forEach(ga => available.push({ type: 'GROUP_ADMIN', id: ga.groupAdminId }));
      }

      if (available.length > 0) {
        contextType = available[0].type;
        contextId = available[0].id;
      } else {
        return next(new AppError('Admin Context headers are required for Advocates', 400));
      }
    }

    if (contextType !== 'TENANT_ADMIN' && contextType !== 'GROUP_ADMIN') {
      return next(new AppError('Invalid Admin Context Type', 400));
    }

    // Verify the requested context belongs to this advocate
    if (contextType === 'TENANT_ADMIN') {
      const advocate = await Advocate.findByPk(user.advocateId, { attributes: ['tenantAdminId', 'tenantId'] });
      if (!advocate || String(advocate.tenantAdminId) !== String(contextId) || String(advocate.tenantId) !== String(user.tenantId)) {
        return next(new AppError('Forbidden: Invalid Tenant Admin context', 403));
      }
    } else if (contextType === 'GROUP_ADMIN') {
      const advocate = await Advocate.findByPk(user.advocateId, { attributes: ['tenantId'] });
      if (!advocate || String(advocate.tenantId) !== String(user.tenantId)) {
        return next(new AppError('Forbidden: Advocate does not belong to your tenant', 403));
      }
      
      const link = await GroupAdminAdvocate.findOne({
        where: { advocateId: user.advocateId, groupAdminId: contextId }
      });
      if (!link) {
        return next(new AppError('Forbidden: Invalid Group Admin context', 403));
      }
    }

    req.user.adminContext = {
      type: contextType,
      id: parseInt(contextId, 10)
    };

    next();
  } catch (error) {
    next(error);
  }
};

module.exports = { validateAdminContext };
