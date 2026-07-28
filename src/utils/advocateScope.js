const AppError = require('./AppError');

/** Returns advocateId when the user is an Advocate; otherwise null (no filter). */
const getAdvocateScopeId = (user) => {
  if (!user || user.role !== 'Advocate') return null;
  return user.advocateId ?? null;
};

/** For Advocate role, require a linked profile. Returns scope id or null for other roles. */
const requireAdvocateScope = (user) => {
  if (!user || user.role !== 'Advocate') return null;
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

module.exports = {
  getAdvocateScopeId,
  requireAdvocateScope,
  assertAdvocateOwnsCase,
};
