const AppError = require('./AppError');
const { isSuperAdmin, isTenantAdmin, isGroupAdmin, isAdvocate } = require('./roleHelper');
const GroupAdminAdvocate = require('../features/users/GroupAdminAdvocate');

/** Returns advocateId when the user is an Advocate; otherwise null (no filter). */
const getAdvocateScopeId = (user) => {
  if (!user || !isAdvocate(user.role)) return null;
  return user.advocateId ?? null;
};

/** Retrieves assigned advocate IDs for a Group Admin user. */
const getGroupAdminAdvocateIds = async (user) => {
  if (!user || !isGroupAdmin(user.role)) return null;
  const links = await GroupAdminAdvocate.findAll({
    where: { groupAdminId: user.id },
    attributes: ['advocateId'],
  });
  return links.map((l) => l.advocateId);
};

/**
 * Returns allowed advocate IDs array for scoped filtering:
 * - Super Admin / Tenant Admin: returns null (all cases in tenant allowed)
 * - Advocate: returns [user.advocateId]
 * - Group Admin: returns [assignedAdvocateIds...]
 */
const getScopedAdvocateIds = async (user) => {
  if (!user) return null;
  if (isSuperAdmin(user.role) || isTenantAdmin(user.role)) return null;
  if (isAdvocate(user.role)) {
    return user.advocateId != null ? [user.advocateId] : [];
  }
  if (isGroupAdmin(user.role)) {
    return getGroupAdminAdvocateIds(user);
  }
  return null;
};

/** For Advocate role, require a linked profile. Returns scope id or null for other roles. */
const requireAdvocateScope = (user) => {
  if (!user || !isAdvocate(user.role)) return null;
  if (user.advocateId == null) {
    throw new AppError(
      'Your account is not linked to an advocate profile. Contact the office admin.',
      403
    );
  }
  return user.advocateId;
};

const assertAdvocateOwnsCase = (caseRecord, advocateId) => {
  if (advocateId == null) return;
  if (caseRecord == null || String(caseRecord.advocateId) !== String(advocateId)) {
    throw new AppError('You can only access cases assigned to you', 403);
  }
};

const assertUserCanAccessAdvocateData = async (targetAdvocateId, user) => {
  if (!user || targetAdvocateId == null) return;
  const allowedIds = await getScopedAdvocateIds(user);
  if (allowedIds !== null) {
    if (!allowedIds.map(String).includes(String(targetAdvocateId))) {
      throw new AppError('Forbidden: Access is restricted to assigned Advocates', 403);
    }
  }
};

module.exports = {
  getAdvocateScopeId,
  getGroupAdminAdvocateIds,
  getScopedAdvocateIds,
  requireAdvocateScope,
  assertAdvocateOwnsCase,
  assertUserCanAccessAdvocateData,
};
