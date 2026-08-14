const bcrypt = require('bcrypt');
const { Op } = require('sequelize');
const { sequelize } = require('../../config/database');
const Advocate = require('./Advocate');
const User = require('../users/User');
const Role = require('../users/Role');
const GroupAdminAdvocate = require('../users/GroupAdminAdvocate');
const AppError = require('../../utils/AppError');
const { isSuperAdmin, isGroupAdmin, normalizeRole } = require('../../utils/roleHelper');

const isGAUser = (user) => {
  if (!user) return false;
  const roleName = typeof user.role === 'object' ? user.role?.name : user.role;
  return isGroupAdmin(roleName) || isGroupAdmin(user.rawRole);
};

const getAssignedAdvocateIds = async (user, transaction) => {
  const links = await GroupAdminAdvocate.findAll({
    where: { groupAdminId: user.id },
    attributes: ['advocateId'],
    transaction,
  });
  return links.map((l) => l.advocateId).filter((id) => id != null);
};

const SAFE_ATTRIBUTES = [
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
  'tenantId',
  'tenantAdminId',
  'created_at',
  'updated_at',
];

const DEFAULT_LOGIN_PASSWORD = 'password';

const toPublicAdvocate = (advocate) => {
  const plain = advocate.get ? advocate.get({ plain: true }) : { ...advocate };
  plain.hasLogin = plain.userId != null;
  if (plain.user) {
    plain.roleId = plain.user.roleId;
    delete plain.user;
  }
  if (plain.groupAdmins) {
    plain.groupAdmins = plain.groupAdmins.map((ga) => ({
      id: ga.id,
      name: ga.name,
      email: ga.email,
    }));
  } else {
    plain.groupAdmins = [];
  }
  if (plain.assignedTenantAdmin) {
    plain.tenantAdmin = {
      id: plain.assignedTenantAdmin.id,
      name: plain.assignedTenantAdmin.name,
      email: plain.assignedTenantAdmin.email,
    };
    delete plain.assignedTenantAdmin;
  }
  return plain;
};

const getAdvocateRoleId = async (transaction) => {
  const role = await Role.findOne({
    where: { name: 'Advocate' },
    attributes: ['id'],
    transaction,
  });
  if (!role) {
    throw new AppError('Advocate role is not configured', 500);
  }
  return role.id;
};

const assertEmailAvailableForAdvocate = async (email, excludeId, transaction) => {
  if (!email) return;
  const existing = await Advocate.findOne({
    where: {
      email,
      ...(excludeId ? { id: { [Op.ne]: excludeId } } : {}),
    },
    attributes: ['id'],
    transaction,
  });
  if (existing) {
    throw new AppError('Email is already registered to another advocate', 409);
  }
};

const assertEmailAvailableForUser = async (email, excludeUserId, transaction) => {
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
    throw new AppError('Email is already registered as a login account', 409);
  }
};

const createLinkedLoginUser = async (
  { name, email, password, status, roleId, tenantId },
  transaction
) => {
  const finalRoleId = roleId || (await getAdvocateRoleId(transaction));
  await assertEmailAvailableForUser(email, null, transaction);

  const passwordHash = await bcrypt.hash(
    password && String(password).trim() ? String(password).trim() : DEFAULT_LOGIN_PASSWORD,
    10
  );

  return User.create(
    {
      name,
      email,
      roleId: finalRoleId,
      passwordHash,
      status: status === 'inactive' ? 'inactive' : 'active',
      tenantId,
    },
    { transaction }
  );
};

const syncLinkedLoginUser = async (
  advocate,
  { name, email, password, status, roleId },
  transaction
) => {
  if (!advocate.userId) return;

  const user = await User.findByPk(advocate.userId, {
    attributes: ['id', 'name', 'email', 'passwordHash', 'status', 'roleId'],
    transaction,
  });
  if (!user) {
    advocate.userId = null;
    return;
  }

  if (email && email !== user.email) {
    await assertEmailAvailableForUser(email, user.id, transaction);
    user.email = email;
  }
  if (name !== undefined) user.name = name;
  if (status !== undefined) {
    user.status = status === 'inactive' ? 'inactive' : 'active';
  }
  if (roleId !== undefined && roleId !== null) {
    user.roleId = roleId;
  }
  if (password && String(password).trim()) {
    user.passwordHash = await bcrypt.hash(String(password).trim(), 10);
  }

  await user.save({ transaction });
};

const getAllAdvocates = async (currentUser) => {
  const isSuper = currentUser ? isSuperAdmin(currentUser.role) : true;
  const isGA = isGAUser(currentUser);

  let advocateIdsFilter = null;

  // If Group Admin, restrict to assigned advocates
  if (isGA && currentUser) {
    advocateIdsFilter = await getAssignedAdvocateIds(currentUser);
    if (advocateIdsFilter.length === 0) {
      return [];
    }
  }

  const whereClause = isSuper ? {} : { tenantId: currentUser.tenantId };
  if (advocateIdsFilter !== null) {
    whereClause.id = { [Op.in]: advocateIdsFilter };
  }


  const include = [
    { model: User, as: 'user', attributes: ['roleId'] },
    {
      model: User,
      as: 'groupAdmins',
      attributes: ['id', 'name', 'email'],
      through: { attributes: [] },
    },
    { model: User, as: 'assignedTenantAdmin', attributes: ['id', 'name', 'email'] },
  ];

  const advocates = await Advocate.findAll({
    where: whereClause,
    attributes: SAFE_ATTRIBUTES,
    include,
    order: [['id', 'ASC']],
  });
  return advocates.map(toPublicAdvocate);
};

const getAdvocateById = async (id, currentUser, transaction) => {
  const include = [
    { model: User, as: 'user', attributes: ['roleId'] },
    {
      model: User,
      as: 'groupAdmins',
      attributes: ['id', 'name', 'email'],
      through: { attributes: [] },
    },
    { model: User, as: 'assignedTenantAdmin', attributes: ['id', 'name', 'email'] },
  ];

  const advocate = await Advocate.findByPk(id, {
    attributes: SAFE_ATTRIBUTES,
    include,
    transaction,
  });
  if (!advocate) {
    throw new AppError('Advocate not found', 404);
  }

  if (currentUser) {
    const isSuper = isSuperAdmin(currentUser.role);
    const isGA = isGAUser(currentUser);

    if (!isSuper && advocate.tenantId !== currentUser.tenantId) {
      throw new AppError('Access denied: Unauthorized cross-tenant access', 403);
    }

    if (isGA) {
      const isAssigned = (advocate.groupAdmins || []).some(
        (ga) => Number(ga.id) === Number(currentUser.id)
      );
      if (!isAssigned) {
        throw new AppError('Access denied: Advocate is not assigned to you', 403);
      }
    }
  }

  return toPublicAdvocate(advocate);
};

const findExistingTenantAdvocate = async (tenantId, { enrolment, email, name }, transaction) => {
  const conditions = [];

  if (enrolment && String(enrolment).trim()) {
    conditions.push({ enrolment: String(enrolment).trim() });
  }
  if (email && String(email).trim()) {
    conditions.push({ email: String(email).trim().toLowerCase() });
  }

  if (conditions.length === 0) return null;

  const include = [
    { model: User, as: 'user', attributes: ['roleId'] },
    {
      model: User,
      as: 'groupAdmins',
      attributes: ['id', 'name', 'email'],
      through: { attributes: [] },
    },
    { model: User, as: 'assignedTenantAdmin', attributes: ['id', 'name', 'email'] },
  ];

  return Advocate.findOne({
    where: {
      tenantId,
      [Op.or]: conditions,
    },
    include,
    transaction,
  });
};

const createAdvocate = async (
  {
    name,
    mobile,
    email,
    specialization,
    enrolment,
    experience,
    relation,
    status,
    password,
    createLogin,
    roleId,
    groupAdminIds,
    tenantAdminId,
  },
  currentUser
) => {
  const normalizedEmail = email ? String(email).trim().toLowerCase() : null;
  const normalizedEnrolment = enrolment ? String(enrolment).trim() : null;

  const wantsLogin =
    createLogin === undefined ? Boolean(normalizedEmail) : Boolean(createLogin);

  if (wantsLogin && !normalizedEmail) {
    throw new AppError('Email is required to create an advocate login', 400);
  }

  const tenantId = currentUser ? currentUser.tenantId : null;
  const isGA = isGAUser(currentUser);

  const include = [
    { model: User, as: 'user', attributes: ['roleId'] },
    {
      model: User,
      as: 'groupAdmins',
      attributes: ['id', 'name', 'email'],
      through: { attributes: [] },
    },
    { model: User, as: 'assignedTenantAdmin', attributes: ['id', 'name', 'email'] },
  ];

  const isTenantAdmin = currentUser && !isGA && !isSuperAdmin(currentUser.role);
  const resolvedTenantAdminId = isTenantAdmin ? currentUser.id : tenantAdminId;

  return sequelize.transaction(async (transaction) => {
    if (isGA && !resolvedTenantAdminId) {
      throw new AppError('Tenant Admin must be selected when creating an advocate', 400);
    }
    
    if (isGA && resolvedTenantAdminId) {
      const ta = await User.findOne({ where: { id: resolvedTenantAdminId, tenantId: currentUser.tenantId }, transaction });
      if (!ta) throw new AppError('Selected Tenant Admin is invalid or belongs to another tenant', 400);
    }

    // 1. Check duplicate advocate within same tenant
    if (tenantId) {
      const existingAdvocate = await findExistingTenantAdvocate(
        tenantId,
        { enrolment: normalizedEnrolment, email: normalizedEmail, name },
        transaction
      );

      if (existingAdvocate) {
        if (existingAdvocate.tenantAdminId && resolvedTenantAdminId && String(existingAdvocate.tenantAdminId) !== String(resolvedTenantAdminId)) {
          throw new AppError('Advocate already exists under a different Tenant Admin. Cannot reassign silently.', 400);
        }

        // If Group Admins passed, link existing advocate
        let gIds = groupAdminIds || [];
        if (isGA && !gIds.includes(currentUser.id)) {
          gIds.push(currentUser.id);
        }
        if (gIds.length > 0) {
          for (const gaId of gIds) {
            await GroupAdminAdvocate.findOrCreate({
              where: { groupAdminId: gaId, advocateId: existingAdvocate.id },
              defaults: { groupAdminId: gaId, advocateId: existingAdvocate.id },
              transaction,
            });
          }
        }
        
        if (!existingAdvocate.tenantAdminId && resolvedTenantAdminId) {
          existingAdvocate.tenantAdminId = resolvedTenantAdminId;
          await existingAdvocate.save({ transaction });
        }

        const updatedExisting = await Advocate.findByPk(existingAdvocate.id, {
          attributes: SAFE_ATTRIBUTES,
          include,
          transaction,
        });
        return toPublicAdvocate(updatedExisting);
      }
    }

    // 2. Assert email availability if creating new advocate
    await assertEmailAvailableForAdvocate(normalizedEmail, null, transaction);
    if (normalizedEmail) {
      await assertEmailAvailableForUser(normalizedEmail, null, transaction);
    }

    let userId = null;
    if (wantsLogin) {
      const user = await createLinkedLoginUser(
        {
          name,
          email: normalizedEmail,
          password,
          status: status || 'active',
          roleId,
          tenantId,
        },
        transaction
      );
      userId = user.id;
    }

    const advocate = await Advocate.create(
      {
        name,
        mobile: mobile || '0000000000',
        email: normalizedEmail,
        specialization: specialization || null,
        enrolment: normalizedEnrolment,
        experience: experience || null,
        relation: relation || 'Junior Advocate',
        status: status || 'active',
        userId,
        tenantId,
        tenantAdminId: resolvedTenantAdminId || null,
      },
      { transaction }
    );

    let gIds = groupAdminIds || [];
    if (isGA && !gIds.includes(currentUser.id)) {
      gIds.push(currentUser.id);
    }
    
    if (gIds.length > 0) {
      for (const gaId of gIds) {
        await GroupAdminAdvocate.findOrCreate({
          where: { groupAdminId: gaId, advocateId: advocate.id },
          defaults: { groupAdminId: gaId, advocateId: advocate.id },
          transaction,
        });
      }
    }

    const createdAdvocate = await Advocate.findByPk(advocate.id, {
      attributes: SAFE_ATTRIBUTES,
      include,
      transaction,
    });

    return toPublicAdvocate(createdAdvocate);
  });
};

const updateAdvocate = async (
  id,
  {
    name,
    mobile,
    email,
    specialization,
    enrolment,
    experience,
    relation,
    status,
    password,
    createLogin,
    roleId,
    groupAdminIds,
    tenantAdminId,
  },
  currentUser
) => {
  return sequelize.transaction(async (transaction) => {
    const advocate = await Advocate.findByPk(id, {
      attributes: SAFE_ATTRIBUTES,
      transaction,
    });

    if (!advocate) {
      throw new AppError('Advocate not found', 404);
    }

    if (currentUser) {
      const isSuper = isSuperAdmin(currentUser.role);
      const isGA = isGAUser(currentUser);

      if (!isSuper && advocate.tenantId !== currentUser.tenantId) {
        throw new AppError('Access denied: Cross-tenant modification blocked', 403);
      }

      if (isGA) {
        const link = await GroupAdminAdvocate.findOne({
          where: { groupAdminId: currentUser.id, advocateId: id },
          transaction,
        });
        if (!link) {
          throw new AppError('Access denied: Advocate is not assigned to you', 403);
        }
      }
    }

    const nextEmail =
      email !== undefined
        ? email
          ? String(email).trim().toLowerCase()
          : null
        : advocate.email;

    if (nextEmail && nextEmail !== advocate.email) {
      await assertEmailAvailableForAdvocate(nextEmail, id, transaction);
      await assertEmailAvailableForUser(nextEmail, advocate.userId, transaction);
    }

    if (name !== undefined) advocate.name = name;
    if (mobile !== undefined) advocate.mobile = mobile;
    if (email !== undefined) advocate.email = nextEmail;
    if (specialization !== undefined) {
      advocate.specialization = specialization || null;
    }
    if (enrolment !== undefined) advocate.enrolment = enrolment || null;
    if (experience !== undefined) advocate.experience = experience || null;
    if (relation) advocate.relation = relation;
    if (status) advocate.status = status;

    // Create login later if requested and none exists yet
    const wantsLogin =
      Boolean(createLogin) ||
      (password && String(password).trim() && !advocate.userId);

    if (!advocate.userId && wantsLogin) {
      if (!nextEmail) {
        throw new AppError('Email is required to create an advocate login', 400);
      }
      const user = await createLinkedLoginUser(
        {
          name: advocate.name,
          email: nextEmail,
          password,
          status: advocate.status,
          roleId,
        },
        transaction
      );
      advocate.userId = user.id;
    } else if (advocate.userId) {
      await syncLinkedLoginUser(
        advocate,
        {
          name: advocate.name,
          email: nextEmail,
          password,
          status: advocate.status,
          roleId,
        },
        transaction
      );
    }

    if (tenantAdminId !== undefined) {
      advocate.tenantAdminId = tenantAdminId || null;
    }

    await advocate.save({ transaction });

    // Sync group admin ids if provided
    if (groupAdminIds !== undefined) {
      const isGA = isGAUser(currentUser);
      let gIds = Array.isArray(groupAdminIds) ? groupAdminIds : [];
      if (isGA && !gIds.includes(currentUser.id)) {
        gIds.push(currentUser.id);
      }
      
      // Remove unassigned
      await GroupAdminAdvocate.destroy({
        where: {
          advocateId: id,
          groupAdminId: { [Op.notIn]: gIds },
        },
        transaction,
      });

      // Add new
      for (const gaId of gIds) {
        await GroupAdminAdvocate.findOrCreate({
          where: { groupAdminId: gaId, advocateId: id },
          defaults: { groupAdminId: gaId, advocateId: id },
          transaction,
        });
      }
    }

    return getAdvocateById(advocate.id, currentUser, transaction);
  });
};

const deleteAdvocate = async (id, currentUser) => {
  return sequelize.transaction(async (transaction) => {
    const advocate = await Advocate.findByPk(id, {
      attributes: SAFE_ATTRIBUTES,
      transaction,
    });

    if (!advocate) {
      throw new AppError('Advocate not found', 404);
    }

    if (currentUser) {
      const isSuper = isSuperAdmin(currentUser.role);
      const isGA = isGAUser(currentUser);
      if (!isSuper && advocate.tenantId !== currentUser.tenantId) {
        throw new AppError('Access denied: Cross-tenant deletion blocked', 403);
      }
      if (isGA) {
        const link = await GroupAdminAdvocate.findOne({
          where: { groupAdminId: currentUser.id, advocateId: id },
          transaction,
        });
        if (!link) {
          throw new AppError('Access denied: Advocate is not assigned to you', 403);
        }
      }
    }

    const linkedUserId = advocate.userId;
    await GroupAdminAdvocate.destroy({ where: { advocateId: id }, transaction });
    await advocate.destroy({ transaction });

    if (linkedUserId) {
      const user = await User.findByPk(linkedUserId, { transaction });
      if (user) {
        await user.destroy({ transaction });
      }
    }

    return true;
  });
};

const searchTenantAdvocates = async (queryStr, currentUser) => {
  const isSuper = isSuperAdmin(currentUser.role);
  const isGA = isGAUser(currentUser);
  
  let advocateIdsFilter = null;
  if (isGA && currentUser) {
    advocateIdsFilter = await getAssignedAdvocateIds(currentUser);
    if (advocateIdsFilter.length === 0) {
      return [];
    }
  }

  const whereClause = isSuper ? {} : { tenantId: currentUser.tenantId };
  if (advocateIdsFilter !== null) {
    whereClause.id = { [Op.in]: advocateIdsFilter };
  }

  if (queryStr && String(queryStr).trim()) {
    const term = `%${String(queryStr).trim()}%`;
    whereClause[Op.or] = [
      { name: { [Op.like]: term } },
      { email: { [Op.like]: term } },
      { enrolment: { [Op.like]: term } },
      { specialization: { [Op.like]: term } },
    ];
  }

  const include = [
    {
      model: User,
      as: 'groupAdmins',
      attributes: ['id', 'name', 'email'],
      through: { attributes: [] },
    },
    { model: User, as: 'assignedTenantAdmin', attributes: ['id', 'name', 'email'] },
  ];

  const advocates = await Advocate.findAll({
    where: whereClause,
    attributes: SAFE_ATTRIBUTES,
    include,
    order: [['name', 'ASC']],
    limit: 20,
  });

  return advocates.map(toPublicAdvocate);
};

module.exports = {
  getAllAdvocates,
  getAdvocateById,
  createAdvocate,
  updateAdvocate,
  deleteAdvocate,
  searchTenantAdvocates,
  DEFAULT_LOGIN_PASSWORD,
};
