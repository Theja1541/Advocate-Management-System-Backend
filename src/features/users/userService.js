const bcrypt = require('bcrypt');
const { User, Role } = require('../associations');
const AppError = require('../../utils/AppError');
const { sequelize } = require('../../config/database');
const { generateTemporaryPassword } = require('../../utils/cryptoUtil');
const emailService = require('../../services/emailService');

const SAFE_ATTRIBUTES = [
  'id',
  'name',
  'email',
  'roleId',
  'tenantId',
  'status',
  'created_at',
  'updated_at',
];

const WRITE_ATTRIBUTES = [...SAFE_ATTRIBUTES, 'passwordHash'];

const roleInclude = {
  model: Role,
  as: 'role',
  attributes: ['id', 'name'],
};

const toPublicUser = (user) => {
  const plain = user.get ? user.get({ plain: true }) : { ...user };
  delete plain.passwordHash;

  const roleName = plain.role?.name ?? null;
  plain.role = roleName;

  return plain;
};

const ensureRoleExists = async (roleId) => {
  const role = await Role.findByPk(roleId);
  if (!role) {
    throw new AppError('Role not found', 404);
  }
  return role;
};

const getAllUsers = async () => {
  const users = await User.findAll({
    attributes: SAFE_ATTRIBUTES,
    include: [roleInclude],
    order: [['id', 'ASC']],
  });
  return users.map(toPublicUser);
};

const getUserById = async (id) => {
  const user = await User.findByPk(id, {
    attributes: SAFE_ATTRIBUTES,
    include: [roleInclude],
  });

  if (!user) {
    throw new AppError('User not found', 404);
  }

  return toPublicUser(user);
};

const createUser = async ({ name, email, roleId, password, status }) => {
  const existing = await User.findOne({
    where: { email },
    attributes: SAFE_ATTRIBUTES,
  });
  if (existing) {
    throw new AppError('Email is already registered', 409);
  }

  await ensureRoleExists(roleId);

  const isTempPassword = !password;
  const actualPassword = password || generateTemporaryPassword();
  const passwordHash = await bcrypt.hash(actualPassword, 10);

  // We wrap in a transaction to rollback if email fails
  const user = await sequelize.transaction(async (transaction) => {
    const newUser = await User.create({
      name,
      email,
      roleId,
      passwordHash,
      status: status || 'active',
      mustChangePassword: isTempPassword,
    }, { transaction });

    if (isTempPassword) {
      const emailResult = await emailService.sendEmail({
        to: email,
        subject: 'Welcome to Advocate Management System',
        text: `Hello ${name},\n\nYour account has been created.\n\nYour temporary password is: ${actualPassword}\n\nPlease login and change your password immediately.\n\nLogin URL: http://localhost:5173/login`,
        html: `
          <p>Hello <strong>${name}</strong>,</p>
          <p>Your account has been successfully created.</p>
          <p>Your temporary password is: <strong>${actualPassword}</strong></p>
          <p>Please login and change your password immediately.</p>
          <p><a href="http://localhost:5173/login">Click here to login</a></p>
        `
      });

      if (!emailResult.success) {
        // Rollback transaction by throwing
        throw new AppError(`Failed to send welcome email: ${emailResult.error}. User creation aborted.`, 500);
      }
    }

    return newUser;
  });

  return getUserById(user.id);
};

const updateUser = async (id, { name, email, roleId, password, status }) => {
  await sequelize.transaction(async (transaction) => {
    const user = await User.findByPk(id, {
      attributes: WRITE_ATTRIBUTES,
      include: [roleInclude],
      transaction,
      bypassTenant: true
    });

    if (!user) {
      throw new AppError('User not found', 404);
    }

    if (email && email !== user.email) {
      const existing = await User.findOne({
        where: { email },
        attributes: SAFE_ATTRIBUTES,
        transaction,
        bypassTenant: true
      });
      if (existing) {
        throw new AppError('Email is already registered', 409);
      }
    }

    if (roleId !== undefined) {
      await ensureRoleExists(roleId);
    }

    const oldStatus = user.status;

    if (name !== undefined) user.name = name;
    if (email !== undefined) user.email = email;
    if (roleId !== undefined) user.roleId = roleId;
    if (status !== undefined) user.status = status;
    if (password) {
      user.passwordHash = await bcrypt.hash(password, 10);
    }

    await user.save({ transaction, bypassTenant: true });

    // Cascade Group Admin deactivation if Tenant Admin is deactivated
    if (user.role?.name === 'Tenant Admin') {
      if (oldStatus === 'active' && user.status === 'inactive') {
        const groupAdminRole = await Role.findOne({ 
          where: { name: 'Group Admin', tenantId: user.tenantId }, 
          transaction, 
          bypassTenant: true 
        });
        
        if (groupAdminRole) {
          await User.update(
            { status: 'inactive' }, 
            { 
              where: { roleId: groupAdminRole.id, tenantId: user.tenantId }, 
              transaction, 
              bypassTenant: true 
            }
          );
        }
      } else if (oldStatus === 'inactive' && user.status === 'active') {
        const { Op } = require('sequelize');
        const { Advocate } = require('../associations');
        
        // Activate all other users in this tenant
        await User.update(
          { status: 'active' },
          {
            where: { tenantId: user.tenantId, id: { [Op.ne]: user.id } },
            transaction,
            bypassTenant: true
          }
        );

        // Activate all advocates in this tenant
        if (Advocate) {
          await Advocate.update(
            { status: 'active' },
            {
              where: { tenantId: user.tenantId },
              transaction,
              bypassTenant: true
            }
          );
        }
      }
    }
  });

  return getUserById(id);
};

const deleteUser = async (id) => {
  const user = await User.findByPk(id, {
    attributes: SAFE_ATTRIBUTES,
  });

  if (!user) {
    throw new AppError('User not found', 404);
  }

  await user.destroy();
  return true;
};

const crypto = require('crypto');

const resetPassword = async (id) => {
  const user = await User.findByPk(id, {
    attributes: WRITE_ATTRIBUTES,
  });

  if (!user) {
    throw new AppError('User not found', 404);
  }

  const tempPassword = crypto.randomBytes(8).toString('hex');
  user.passwordHash = await bcrypt.hash(tempPassword, 10);
  user.mustChangePassword = true;
  
  await user.save();

  return { tempPassword, email: user.email };
};

module.exports = {
  getAllUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
  resetPassword,
};
