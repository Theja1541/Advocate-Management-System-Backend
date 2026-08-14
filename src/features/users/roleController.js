const { Role, Module, Permission } = require('../associations');
const AppError = require('../../utils/AppError');
const logger = require('../../config/logger');
const { sequelize } = require('../../config/database');

// --- Roles CRUD ---

exports.createRole = async (req, res, next) => {
  try {
    const { name, description } = req.body;

    if (!name) {
      return next(new AppError('Role name is required', 400));
    }

    const role = await Role.create({ name, description });

    // Initialize blank permissions for all modules for this new role
    const modules = await Module.findAll();
    const defaultPerms = modules.map(m => ({
      roleId: role.id,
      moduleId: m.id,
      accessLevel: '—'
    }));
    await Permission.bulkCreate(defaultPerms);

    res.status(201).json({
      status: 'success',
      data: { role }
    });
  } catch (error) {
    logger.error('CreateRole error:', error);
    next(error);
  }
};

exports.getAllRoles = async (req, res, next) => {
  try {
    const roles = await Role.findAll();
    res.status(200).json({
      status: 'success',
      data: { roles }
    });
  } catch (error) {
    logger.error('GetAllRoles error:', error);
    next(error);
  }
};

exports.getRoleById = async (req, res, next) => {
  try {
    const role = await Role.findByPk(req.params.id, {
      include: [
        {
          model: Module,
          as: 'modules',
          through: { attributes: ['accessLevel'] }
        }
      ]
    });

    if (!role) {
      return next(new AppError('Role not found', 404));
    }

    res.status(200).json({
      status: 'success',
      data: { role }
    });
  } catch (error) {
    logger.error('GetRoleById error:', error);
    next(error);
  }
};

exports.updateRole = async (req, res, next) => {
  try {
    const { name, description } = req.body;
    const role = await Role.findByPk(req.params.id);

    if (!role) {
      return next(new AppError('Role not found', 404));
    }

    await role.update({ name, description });

    res.status(200).json({
      status: 'success',
      data: { role }
    });
  } catch (error) {
    logger.error('UpdateRole error:', error);
    next(error);
  }
};

exports.deleteRole = async (req, res, next) => {
  try {
    const role = await Role.findByPk(req.params.id);

    if (!role) {
      return next(new AppError('Role not found', 404));
    }

    await role.destroy();

    res.status(204).json({
      status: 'success',
      data: null
    });
  } catch (error) {
    logger.error('DeleteRole error:', error);
    next(error);
  }
};

// --- Permissions Assignment ---

const VALID_LEVELS = ['---', 'V', 'VE', 'VA', 'VEA'];

const upsertPermission = async ({ roleId, moduleId, accessLevel }, options = {}) => {
  const role = await Role.findByPk(roleId, {
    attributes: ['id', 'name'],
    transaction: options.transaction,
  });
  if (!role) throw new AppError('Role not found', 404);

  const moduleRow = await Module.findByPk(moduleId, {
    attributes: ['id'],
    transaction: options.transaction,
  });
  if (!moduleRow) throw new AppError('Module not found', 404);

  if (!VALID_LEVELS.includes(accessLevel)) {
    throw new AppError('Invalid permission level value', 400);
  }

  let permission = await Permission.findOne({
    where: { roleId, moduleId },
    transaction: options.transaction,
  });

  let created = false;
  if (!permission) {
    permission = await Permission.create(
      { roleId, moduleId, accessLevel },
      { transaction: options.transaction }
    );
    created = true;
  } else {
    await permission.update({ accessLevel }, { transaction: options.transaction });
  }

  if (role.name === 'Tenant Admin') {
    const groupAdminRole = await Role.findOne({
      where: { name: 'Group Admin' },
      attributes: ['id'],
      transaction: options.transaction,
    });
    if (groupAdminRole) {
      let gaPermission = await Permission.findOne({
        where: { roleId: groupAdminRole.id, moduleId },
        transaction: options.transaction,
      });
      if (!gaPermission) {
        await Permission.create(
          { roleId: groupAdminRole.id, moduleId, accessLevel },
          { transaction: options.transaction }
        );
      } else {
        await gaPermission.update({ accessLevel }, { transaction: options.transaction });
      }
    }
  }

  return { permission, created };
};

exports.updatePermission = async (req, res, next) => {
  try {
    const { roleId, moduleId, accessLevel, permissions } = req.body;

    // Bulk matrix update: { permissions: [{ roleId, moduleId, accessLevel }, ...] }
    if (Array.isArray(permissions)) {
      if (!permissions.length) {
        return next(new AppError('permissions array cannot be empty', 400));
      }

      const results = await sequelize.transaction(async (transaction) => {
        const updated = [];
        for (const entry of permissions) {
          const { permission } = await upsertPermission(entry, { transaction });
          updated.push(permission);
        }
        return updated;
      });

      return res.status(200).json({
        status: 'success',
        results: results.length,
        data: { permissions: results },
      });
    }

    if (roleId == null || moduleId == null || accessLevel == null) {
      return next(new AppError('Please provide roleId, moduleId and accessLevel', 400));
    }

    const { permission, created } = await upsertPermission({
      roleId,
      moduleId,
      accessLevel,
    });

    res.status(created ? 201 : 200).json({
      status: 'success',
      data: { permission },
    });
  } catch (error) {
    logger.error('UpdatePermission error:', error);
    next(error);
  }
};

exports.getAllModules = async (req, res, next) => {
  try {
    const modules = await Module.findAll();
    res.status(200).json({
      status: 'success',
      data: { modules }
    });
  } catch (error) {
    logger.error('GetAllModules error:', error);
    next(error);
  }
};
