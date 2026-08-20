const { Op } = require('sequelize');
const { Membership, User, Role } = require('../associations');
const AppError = require('../../utils/AppError');
const { isGroupAdmin } = require('../../utils/roleHelper');

const SAFE_ATTRIBUTES = [
  'id',
  'groupAdminId',
  'planName',
  'feeAmount',
  'startDate',
  'expiryDate',
  'status',
  'createdBy',
  'updatedBy',
  'created_at',
  'updated_at',
];

const groupAdminInclude = {
  model: User,
  as: 'groupAdmin',
  attributes: ['id', 'name', 'email', 'status', 'tenantId'],
  include: [{ model: Role, as: 'role', attributes: ['name'] }]
};

const toPublicMembership = (membership) => {
  const plain = membership.get ? membership.get({ plain: true }) : { ...membership };
  plain.feeAmount = Number(plain.feeAmount || 0);
  plain.status = deriveStatus(plain.expiryDate, plain.status);
  return plain;
};

const daysUntil = (expiryDate) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const expiry = new Date(`${expiryDate}T00:00:00`);
  return Math.ceil((expiry - today) / (1000 * 60 * 60 * 24));
};

const deriveStatus = (expiryDate) => {
  const days = daysUntil(expiryDate);
  if (days < 0) return 'expired';
  if (days <= 30) return 'expiring';
  return 'active';
};

const assertGroupAdminValid = async (groupAdminId, currentUser) => {
  const user = await User.findByPk(groupAdminId, {
    attributes: ['id', 'tenantId'],
    include: [{ model: Role, as: 'role', attributes: ['name'] }]
  });
  
  if (!user) throw new AppError('Group Admin not found', 400);
  
  // Tenant isolation
  if (currentUser && currentUser.role?.name !== 'Super Admin') {
    if (user.tenantId !== currentUser.tenantId) {
      throw new AppError('Cannot assign membership to a Group Admin outside your tenant', 403);
    }
  }

  // Validate it's actually a Group Admin
  if (user.role?.name !== 'Group Admin') {
    throw new AppError('Selected user is not a Group Admin', 400);
  }
};

const assertUserExists = async (userId, fieldLabel) => {
  if (userId == null) return;
  const user = await User.findByPk(userId, { attributes: ['id'] });
  if (!user) throw new AppError(`${fieldLabel} user not found`, 400);
};

const addYears = (dateStr, years = 1) => {
  const d = new Date(`${dateStr}T00:00:00`);
  d.setFullYear(d.getFullYear() + years);
  return d.toISOString().slice(0, 10);
};

const getAllMemberships = async (currentUser = null) => {
  const where = {};
  
  if (currentUser) {
    if (isGroupAdmin(currentUser.role)) {
      where.groupAdminId = currentUser.id;
    } else if (currentUser.role?.name !== 'Super Admin') {
      // Must be within tenant
      // We'll filter the included User model by tenantId
    }
  }

  const queryOptions = {
    where,
    attributes: SAFE_ATTRIBUTES,
    include: [{
      ...groupAdminInclude,
      where: (currentUser && currentUser.role?.name !== 'Super Admin') 
        ? { tenantId: currentUser.tenantId } 
        : undefined
    }],
    order: [['expiryDate', 'ASC'], ['id', 'ASC']],
  };

  const memberships = await Membership.findAll(queryOptions);

  const result = [];
  for (const membership of memberships) {
    const publicMembership = toPublicMembership(membership);
    if (membership.status !== publicMembership.status) {
      membership.status = publicMembership.status;
      await membership.save();
    }
    result.push(publicMembership);
  }
  return result;
};

const getMembershipById = async (id, currentUser) => {
  const membership = await Membership.findByPk(id, {
    attributes: SAFE_ATTRIBUTES,
    include: [groupAdminInclude],
  });
  if (!membership) throw new AppError('Membership not found', 404);

  if (currentUser && currentUser.role?.name !== 'Super Admin') {
    if (membership.groupAdmin?.tenantId !== currentUser.tenantId) {
      throw new AppError('Access denied', 403);
    }
    if (isGroupAdmin(currentUser.role) && Number(membership.groupAdminId) !== Number(currentUser.id)) {
      throw new AppError('Access denied', 403);
    }
  }

  const publicMembership = toPublicMembership(membership);
  if (membership.status !== publicMembership.status) {
    membership.status = publicMembership.status;
    await membership.save();
  }
  return publicMembership;
};

const createMembership = async ({
  groupAdminId,
  planName,
  feeAmount,
  startDate,
  expiryDate,
  createdBy,
  updatedBy,
}, currentUser) => {
  await assertGroupAdminValid(groupAdminId, currentUser);
  await assertUserExists(createdBy, 'createdBy');
  await assertUserExists(updatedBy, 'updatedBy');

  const existing = await Membership.findOne({
    where: { groupAdminId },
    attributes: ['id'],
  });
  if (existing) {
    throw new AppError('Membership already exists for this Group Admin', 409);
  }

  const membership = await Membership.create({
    groupAdminId,
    planName,
    feeAmount,
    startDate,
    expiryDate,
    status: deriveStatus(expiryDate),
    createdBy: createdBy || null,
    updatedBy: updatedBy || null,
  });

  return getMembershipById(membership.id, currentUser);
};

const updateMembership = async (
  id,
  { groupAdminId, planName, feeAmount, startDate, expiryDate, status, updatedBy },
  currentUser
) => {
  const membership = await Membership.findByPk(id, { attributes: SAFE_ATTRIBUTES });
  if (!membership) throw new AppError('Membership not found', 404);

  // Check access before update
  await getMembershipById(id, currentUser);

  if (groupAdminId !== undefined && Number(groupAdminId) !== Number(membership.groupAdminId)) {
    await assertGroupAdminValid(groupAdminId, currentUser);
    const existing = await Membership.findOne({
      where: { groupAdminId, id: { [Op.ne]: id } },
      attributes: ['id'],
    });
    if (existing) {
      throw new AppError('Membership already exists for this Group Admin', 409);
    }
    membership.groupAdminId = groupAdminId;
  }

  if (updatedBy !== undefined) {
    await assertUserExists(updatedBy, 'updatedBy');
    membership.updatedBy = updatedBy;
  }

  if (planName !== undefined) membership.planName = planName;
  if (feeAmount !== undefined) membership.feeAmount = feeAmount;
  if (startDate !== undefined) membership.startDate = startDate;
  if (expiryDate !== undefined) membership.expiryDate = expiryDate;

  const nextExpiry = expiryDate !== undefined ? expiryDate : membership.expiryDate;
  membership.status = status || deriveStatus(nextExpiry);

  await membership.save();
  return getMembershipById(membership.id, currentUser);
};

const renewMembership = async (id, currentUser, { updatedBy } = {}) => {
  const membership = await Membership.findByPk(id, { attributes: SAFE_ATTRIBUTES });
  if (!membership) throw new AppError('Membership not found', 404);

  // Check access
  await getMembershipById(id, currentUser);

  if (updatedBy !== undefined) {
    await assertUserExists(updatedBy, 'updatedBy');
    membership.updatedBy = updatedBy;
  }

  const today = new Date().toISOString().slice(0, 10);
  const base =
    membership.expiryDate && membership.expiryDate > today
      ? membership.expiryDate
      : today;

  membership.expiryDate = addYears(base, 1);
  if (!membership.startDate || membership.status === 'expired') {
    membership.startDate = today;
  }
  membership.status = deriveStatus(membership.expiryDate);

  await membership.save();
  return getMembershipById(membership.id, currentUser);
};

const deleteMembership = async (id, currentUser) => {
  const membership = await Membership.findByPk(id, { attributes: SAFE_ATTRIBUTES });
  if (!membership) throw new AppError('Membership not found', 404);
  
  // Check access
  await getMembershipById(id, currentUser);

  await membership.destroy();
  return true;
};

module.exports = {
  getAllMemberships,
  getMembershipById,
  createMembership,
  updateMembership,
  renewMembership,
  deleteMembership,
  deriveStatus,
};
