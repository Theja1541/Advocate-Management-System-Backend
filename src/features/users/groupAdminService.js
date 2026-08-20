const bcrypt = require('bcrypt');
const { Op } = require('sequelize');
const { sequelize } = require('../../config/database');
const { User, Role, Advocate, GroupAdminAdvocate } = require('../associations');
const AppError = require('../../utils/AppError');
const { isSuperAdmin, isTenantAdmin, isGroupAdmin, normalizeRole } = require('../../utils/roleHelper');
const { generateTemporaryPassword } = require('../../utils/cryptoUtil');
const emailService = require('../../services/emailService');

const DEFAULT_LOGIN_PASSWORD = 'password';

const getGroupAdminRoleId = async (tenantId, transaction) => {
  let role = await Role.findOne({
    where: {
      name: 'Group Admin',
      [Op.or]: [{ tenantId }, { tenantId: null }],
    },
    transaction,
  });

  if (!role) {
    role = await Role.create(
      {
        name: 'Group Admin',
        description: 'Group administrator with advocate management privileges',
        tenantId,
      },
      { transaction, bypassTenant: true }
    );
  }

  return role.id;
};

const assertEmailAvailable = async (email, excludeUserId, transaction) => {
  if (!email) return;
  const existing = await User.findOne({
    where: {
      email,
      ...(excludeUserId ? { id: { [Op.ne]: excludeUserId } } : {}),
    },
    attributes: ['id'],
    transaction,
  });
  if (existing) {
    throw new AppError('Email is already registered', 409);
  }
};

const createGroupAdmin = async ({ name, email, password, status }, currentUser) => {
  const tenantId = currentUser.tenantId;
  if (!tenantId && !isSuperAdmin(currentUser.role)) {
    throw new AppError('Tenant context missing', 400);
  }

  const normalizedEmail = email ? String(email).trim().toLowerCase() : null;
  if (!normalizedEmail) {
    throw new AppError('Email is required to create a Group Admin', 400);
  }

  return sequelize.transaction(async (transaction) => {
    await assertEmailAvailable(normalizedEmail, null, transaction);

    const roleId = await getGroupAdminRoleId(tenantId, transaction);

    const isTempPassword = !(password && String(password).trim());
    const actualPassword = isTempPassword ? generateTemporaryPassword() : String(password).trim();
    const passwordHash = await bcrypt.hash(actualPassword, 10);

    const user = await User.create(
      {
        name,
        email: normalizedEmail,
        passwordHash,
        roleId,
        status: status === 'inactive' ? 'inactive' : 'active',
        tenantId,
        mustChangePassword: isTempPassword,
      },
      { transaction }
    );

    if (isTempPassword) {
      const emailResult = await emailService.sendEmail({
        to: normalizedEmail,
        subject: 'Welcome to Advocate Management System - Group Admin',
        text: `Hello ${name},\n\nYour Group Admin account has been created.\n\nYour temporary password is: ${actualPassword}\n\nPlease login and change your password immediately.\n\nLogin URL: http://localhost:5173/login`,
        html: `
          <p>Hello <strong>${name}</strong>,</p>
          <p>Your Group Admin account has been successfully created.</p>
          <p>Your temporary password is: <strong>${actualPassword}</strong></p>
          <p>Please login and change your password immediately.</p>
          <p><a href="http://localhost:5173/login">Click here to login</a></p>
        `
      });

      if (!emailResult.success) {
        throw new AppError(`Failed to send welcome email: ${emailResult.error}. User creation aborted.`, 500);
      }
    }

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      role: 'Group Admin',
      status: user.status,
      tenantId: user.tenantId,
      created_at: user.created_at,
    };
  });
};

const getGroupAdmins = async (currentUser, queryTenantId) => {
  const isSuper = isSuperAdmin(currentUser.role);
  const isGA = isGroupAdmin(currentUser.role);

  const whereClause = isSuper ? {} : { tenantId: currentUser.tenantId };
  if (isSuper && queryTenantId) {
    whereClause.tenantId = queryTenantId;
  }
  
  if (isGA && currentUser) {
    whereClause.id = currentUser.id;
  }

  // Find Group Admin role IDs
  const roles = await Role.findAll({
    where: {
      [Op.or]: [
        { name: 'Group Admin' },
        { name: { [Op.like]: '%Group Admin%' } },
      ],
    },
    attributes: ['id'],
  });
  const roleIds = roles.map((r) => r.id);

  if (roleIds.length === 0) {
    return [];
  }

  const groupAdmins = await User.findAll({
    where: {
      ...whereClause,
      roleId: { [Op.in]: roleIds },
    },

    attributes: ['id', 'name', 'email', 'status', 'tenantId', 'created_at', 'updated_at'],
    include: [
      {
        model: Advocate,
        as: 'assignedAdvocates',
        attributes: ['id', 'name', 'email', 'specialization', 'enrolment', 'status'],
        through: { attributes: [] },
      },
    ],
    order: [['id', 'ASC']],
  });

  return groupAdmins.map((ga) => {
    const plain = ga.get({ plain: true });
    plain.role = 'Group Admin';
    plain.advocateCount = plain.assignedAdvocates ? plain.assignedAdvocates.length : 0;
    return plain;
  });
};

const getGroupAdminById = async (id, currentUser) => {
  const isSuper = isSuperAdmin(currentUser.role);

  const groupAdmin = await User.findByPk(id, {
    attributes: ['id', 'name', 'email', 'status', 'roleId', 'tenantId', 'created_at', 'updated_at'],
    include: [
      {
        model: Role,
        as: 'role',
        attributes: ['name'],
      },
      {
        model: Advocate,
        as: 'assignedAdvocates',
        attributes: ['id', 'name', 'email', 'specialization', 'enrolment', 'status', 'userId'],
        through: { attributes: [] },
      },
    ],
  });

  if (!groupAdmin) {
    throw new AppError('Group Admin not found', 404);
  }

  if (!isSuper && groupAdmin.tenantId !== currentUser.tenantId) {
    throw new AppError('Access denied: Unauthorized cross-tenant request', 403);
  }

  const normalized = normalizeRole(groupAdmin.role?.name);
  if (normalized !== 'Group Admin') {
    throw new AppError('User is not a Group Admin', 400);
  }

  const plain = groupAdmin.get({ plain: true });
  plain.role = 'Group Admin';
  plain.advocateCount = plain.assignedAdvocates ? plain.assignedAdvocates.length : 0;
  return plain;
};

const updateGroupAdmin = async (id, data, currentUser) => {
  const isSuper = isSuperAdmin(currentUser.role);

  return sequelize.transaction(async (transaction) => {
    const user = await User.findByPk(id, { transaction });
    if (!user) {
      throw new AppError('Group Admin not found', 404);
    }

    if (!isSuper && user.tenantId !== currentUser.tenantId) {
      throw new AppError('Access denied: Unauthorized cross-tenant request', 403);
    }

    if (data.email && data.email !== user.email) {
      const nextEmail = String(data.email).trim().toLowerCase();
      await assertEmailAvailable(nextEmail, user.id, transaction);
      user.email = nextEmail;
    }

    if (data.name !== undefined) user.name = data.name;
    if (data.status !== undefined) user.status = data.status === 'inactive' ? 'inactive' : 'active';
    if (data.password && String(data.password).trim()) {
      user.passwordHash = await bcrypt.hash(String(data.password).trim(), 10);
    }

    await user.save({ transaction });

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      role: 'Group Admin',
      status: user.status,
      tenantId: user.tenantId,
      updated_at: user.updated_at,
    };
  });
};

const assignAdvocateToGroupAdmin = async (groupAdminId, advocateId, currentUser) => {
  const isSuper = isSuperAdmin(currentUser.role);
  const isGA = isGroupAdmin(currentUser.role);

  if (isGA && Number(currentUser.id) !== Number(groupAdminId)) {
    throw new AppError('Access denied: Group Admins can only assign advocates to themselves', 403);
  }

  // 1. Verify Group Admin
  const groupAdmin = await User.findByPk(groupAdminId, {
    include: [{ model: Role, as: 'role', attributes: ['name'] }],
  });
  if (!groupAdmin) {
    throw new AppError('Group Admin not found', 404);
  }

  if (!isSuper && groupAdmin.tenantId !== currentUser.tenantId) {
    throw new AppError('Access denied: Group Admin belongs to another tenant', 403);
  }

  const roleName = normalizeRole(groupAdmin.role?.name);
  if (roleName !== 'Group Admin') {
    throw new AppError('Target user is not a Group Admin', 400);
  }

  // 2. Verify Advocate
  const advocate = await Advocate.findByPk(advocateId);
  if (!advocate) {
    throw new AppError('Advocate not found', 404);
  }

  if (!isSuper && advocate.tenantId !== currentUser.tenantId) {
    throw new AppError('Access denied: Advocate belongs to another tenant', 403);
  }

  // Tenant validation for junction: groupAdmin.tenant_id === advocate.tenant_id
  if (groupAdmin.tenantId !== advocate.tenantId) {
    throw new AppError('Tenant mismatch: Group Admin and Advocate must belong to the same tenant', 400);
  }

  // 3. Create or find existing link
  const [link, created] = await GroupAdminAdvocate.findOrCreate({
    where: {
      groupAdminId,
      advocateId,
    },
    defaults: {
      groupAdminId,
      advocateId,
    },
  });

  return {
    groupAdminId,
    advocateId,
    assigned: true,
    isNew: created,
  };
};

const removeAdvocateFromGroupAdmin = async (groupAdminId, advocateId, currentUser) => {
  const isSuper = isSuperAdmin(currentUser.role);
  const isGA = isGroupAdmin(currentUser.role);

  if (isGA && Number(currentUser.id) !== Number(groupAdminId)) {
    throw new AppError('Access denied: Group Admins can only remove advocates assigned to themselves', 403);
  }

  // Verify Group Admin
  const groupAdmin = await User.findByPk(groupAdminId);
  if (!groupAdmin) {
    throw new AppError('Group Admin not found', 404);
  }
  if (!isSuper && groupAdmin.tenantId !== currentUser.tenantId) {
    throw new AppError('Access denied', 403);
  }

  // Verify Advocate
  const advocate = await Advocate.findByPk(advocateId);
  if (!advocate) {
    throw new AppError('Advocate not found', 404);
  }
  if (!isSuper && advocate.tenantId !== currentUser.tenantId) {
    throw new AppError('Access denied', 403);
  }

  await GroupAdminAdvocate.destroy({
    where: {
      groupAdminId,
      advocateId,
    },
  });

  return { groupAdminId, advocateId, removed: true };
};

const getAssignedAdvocates = async (groupAdminId, currentUser) => {
  const isSuper = isSuperAdmin(currentUser.role);
  const isGA = isGroupAdmin(currentUser.role);

  // If Group Admin is requesting their own advocates
  if (isGA && Number(currentUser.id) !== Number(groupAdminId)) {
    throw new AppError('Access denied: Group Admins can only view their own assigned advocates', 403);
  }

  const groupAdmin = await User.findByPk(groupAdminId, {
    attributes: ['id', 'name', 'email', 'tenantId'],
    include: [
      {
        model: Advocate,
        as: 'assignedAdvocates',
        attributes: [
          'id',
          'name',
          'mobile',
          'email',
          'specialization',
          'enrolment',
          'experience',
          'relation',
          'status',
          'userId',
          'created_at',
          'updated_at',
        ],
        through: { attributes: [] },
      },
    ],
  });

  if (!groupAdmin) {
    throw new AppError('Group Admin not found', 404);
  }

  if (!isSuper && groupAdmin.tenantId !== currentUser.tenantId) {
    throw new AppError('Access denied: Unauthorized cross-tenant request', 403);
  }

  return groupAdmin.assignedAdvocates || [];
};

module.exports = {
  createGroupAdmin,
  getGroupAdmins,
  getGroupAdminById,
  updateGroupAdmin,
  assignAdvocateToGroupAdmin,
  removeAdvocateFromGroupAdmin,
  getAssignedAdvocates,
};
