const { Op } = require('sequelize');
const { Membership, Advocate, User } = require('../associations');
const AppError = require('../../utils/AppError');

const SAFE_ATTRIBUTES = [
  'id',
  'advocateId',
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

const advocateInclude = {
  model: Advocate,
  as: 'advocate',
  attributes: ['id', 'name', 'enrolment', 'status'],
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

const assertAdvocateExists = async (advocateId) => {
  const advocate = await Advocate.findByPk(advocateId, { attributes: ['id'] });
  if (!advocate) throw new AppError('Advocate not found', 400);
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

const { getScopedAdvocateIds } = require('../../utils/advocateScope');

const { isGroupAdmin } = require('../../utils/roleHelper');

const getAllMemberships = async (currentUser = null) => {
  const where = {};
  if (currentUser) {
    if (isGroupAdmin(currentUser.role)) {
      where.createdBy = currentUser.id;
    } else {
      const allowedAdvocateIds = await getScopedAdvocateIds(currentUser);
      if (allowedAdvocateIds !== null) {
        if (allowedAdvocateIds.length === 0) {
          return [];
        }
        where.advocateId = { [Op.in]: allowedAdvocateIds };
      }
    }
  }


  const memberships = await Membership.findAll({
    where,
    attributes: SAFE_ATTRIBUTES,
    include: [advocateInclude],
    order: [['expiryDate', 'ASC'], ['id', 'ASC']],
  });


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

const getMembershipById = async (id) => {
  const membership = await Membership.findByPk(id, {
    attributes: SAFE_ATTRIBUTES,
    include: [advocateInclude],
  });
  if (!membership) throw new AppError('Membership not found', 404);

  const publicMembership = toPublicMembership(membership);
  if (membership.status !== publicMembership.status) {
    membership.status = publicMembership.status;
    await membership.save();
  }
  return publicMembership;
};

const createMembership = async ({
  advocateId,
  planName,
  feeAmount,
  startDate,
  expiryDate,
  createdBy,
  updatedBy,
}) => {
  await assertAdvocateExists(advocateId);
  await assertUserExists(createdBy, 'createdBy');
  await assertUserExists(updatedBy, 'updatedBy');

  const existing = await Membership.findOne({
    where: { advocateId },
    attributes: ['id'],
  });
  if (existing) {
    throw new AppError('Membership already exists for this advocate', 409);
  }

  const membership = await Membership.create({
    advocateId,
    planName,
    feeAmount,
    startDate,
    expiryDate,
    status: deriveStatus(expiryDate),
    createdBy: createdBy || null,
    updatedBy: updatedBy || null,
  });

  return getMembershipById(membership.id);
};

const updateMembership = async (
  id,
  { advocateId, planName, feeAmount, startDate, expiryDate, status, updatedBy }
) => {
  const membership = await Membership.findByPk(id, { attributes: SAFE_ATTRIBUTES });
  if (!membership) throw new AppError('Membership not found', 404);

  if (advocateId !== undefined && Number(advocateId) !== Number(membership.advocateId)) {
    await assertAdvocateExists(advocateId);
    const existing = await Membership.findOne({
      where: { advocateId, id: { [Op.ne]: id } },
      attributes: ['id'],
    });
    if (existing) {
      throw new AppError('Membership already exists for this advocate', 409);
    }
    membership.advocateId = advocateId;
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
  return getMembershipById(membership.id);
};

const renewMembership = async (id, { updatedBy } = {}) => {
  const membership = await Membership.findByPk(id, { attributes: SAFE_ATTRIBUTES });
  if (!membership) throw new AppError('Membership not found', 404);

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
  return getMembershipById(membership.id);
};

const deleteMembership = async (id) => {
  const membership = await Membership.findByPk(id, { attributes: SAFE_ATTRIBUTES });
  if (!membership) throw new AppError('Membership not found', 404);
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
