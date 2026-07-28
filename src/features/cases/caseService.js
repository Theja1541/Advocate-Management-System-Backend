const { Case, Advocate, Client, CaseType, CaseStage, CaseStageHistory, Court } = require('../associations');
const AppError = require('../../utils/AppError');
const { assertAdvocateOwnsCase } = require('../../utils/advocateScope');
const { sequelize } = require('../../config/database');

const SAFE_ATTRIBUTES = [
  'id',
  'caseNo',
  'title',
  'status',
  'court',
  'nextHearing',
  'advocateId',
  'clientId',
  'caseTypeId',
  'caseStageId',
  'courtId',
  'approvalLevel',
  'created_at',
  'updated_at',
];

const caseIncludes = [
  { model: CaseType, as: 'caseType', attributes: ['id', 'code', 'name'] },
  { model: CaseStage, as: 'currentStage', attributes: ['id', 'code', 'name', 'color', 'isClosed'] },
  { model: Client, as: 'client', attributes: ['id', 'name'] },
  { model: Advocate, as: 'assignedAdvocate', attributes: ['id', 'name'] },
  { model: Court, as: 'assignedCourt', attributes: ['id', 'code', 'name', 'location'] },
];

const toPublicCase = (caseRecord) => {
  if (!caseRecord) return null;
  return caseRecord.get ? caseRecord.get({ plain: true }) : { ...caseRecord };
};

const assertAdvocateExists = async (advocateId) => {
  if (advocateId == null) return;
  const advocate = await Advocate.findByPk(advocateId, { attributes: ['id'] });
  if (!advocate) {
    throw new AppError('Advocate not found', 400);
  }
};

const assertClientExists = async (clientId) => {
  if (clientId == null) return;
  const client = await Client.findByPk(clientId, { attributes: ['id'] });
  if (!client) {
    throw new AppError('Client not found', 400);
  }
};

const validateCaseMasters = async (caseTypeId, caseStageId, courtId) => {
  if (caseTypeId) {
    const ct = await CaseType.findByPk(caseTypeId);
    if (!ct) {
      throw new AppError('Selected Case Type does not exist', 400);
    }
    if (!ct.isActive) {
      throw new AppError('Selected Case Type is inactive and cannot be assigned', 400);
    }
  }
  if (caseStageId) {
    const cs = await CaseStage.findByPk(caseStageId);
    if (!cs) {
      throw new AppError('Selected Case Stage does not exist', 400);
    }
    if (!cs.isActive) {
      throw new AppError('Selected Case Stage is inactive and cannot be assigned', 400);
    }
  }
  if (courtId) {
    const crt = await Court.findByPk(courtId);
    if (!crt) {
      throw new AppError('Selected Court does not exist', 400);
    }
    if (!crt.isActive) {
      throw new AppError('Selected Court is inactive and cannot be assigned', 400);
    }
  }
};

const getAllCases = async ({ advocateId } = {}) => {
  const where = {};
  if (advocateId != null) {
    where.advocateId = advocateId;
  }

  const cases = await Case.findAll({
    where,
    attributes: SAFE_ATTRIBUTES,
    include: caseIncludes,
    order: [['id', 'ASC']],
  });
  return cases.map(toPublicCase);
};

const getCaseById = async (id, { advocateId } = {}) => {
  const caseRecord = await Case.findByPk(id, {
    attributes: SAFE_ATTRIBUTES,
    include: caseIncludes,
  });

  if (!caseRecord) {
    throw new AppError('Case not found', 404);
  }

  assertAdvocateOwnsCase(caseRecord, advocateId);

  return toPublicCase(caseRecord);
};

const createCase = async (
  {
    caseNo,
    title,
    status,
    court,
    nextHearing,
    advocateId,
    clientId,
    caseTypeId,
    caseStageId,
    courtId,
    approvalLevel,
  },
  { advocateId: scopedAdvocateId, user } = {}
) => {
  const existing = await Case.findOne({
    where: { caseNo },
    attributes: SAFE_ATTRIBUTES,
  });
  if (existing) {
    throw new AppError('Case number is already registered', 409);
  }

  const resolvedAdvocateId =
    scopedAdvocateId != null ? scopedAdvocateId : advocateId;

  if (scopedAdvocateId != null && advocateId != null && String(advocateId) !== String(scopedAdvocateId)) {
    throw new AppError('You can only create cases assigned to yourself', 403);
  }

  await assertAdvocateExists(resolvedAdvocateId);
  await assertClientExists(clientId);
  await validateCaseMasters(caseTypeId, caseStageId, courtId);

  const t = await sequelize.transaction();
  try {
    const caseRecord = await Case.create({
      caseNo,
      title,
      status: status || 'Active',
      court: court || null,
      nextHearing: nextHearing || null,
      advocateId: resolvedAdvocateId || null,
      clientId: clientId || null,
      caseTypeId: caseTypeId || null,
      caseStageId: caseStageId || null,
      courtId: courtId || null,
      approvalLevel: approvalLevel ?? null,
    }, { transaction: t });

    if (caseStageId) {
      await CaseStageHistory.create({
        caseId: caseRecord.id,
        oldStageId: null,
        newStageId: caseStageId,
        remarks: 'Initial Stage Assignment on Creation',
        changedBy: user?.id || null,
      }, { transaction: t });
    }

    await t.commit();
    return getCaseById(caseRecord.id, { advocateId: scopedAdvocateId });
  } catch (error) {
    await t.rollback();
    throw error;
  }
};

const updateCase = async (
  id,
  { caseNo, title, status, court, nextHearing, advocateId, clientId, caseTypeId, caseStageId, courtId, approvalLevel },
  { advocateId: scopedAdvocateId, user } = {}
) => {
  const caseRecord = await Case.findByPk(id, {
    attributes: SAFE_ATTRIBUTES,
  });

  if (!caseRecord) {
    throw new AppError('Case not found', 404);
  }

  assertAdvocateOwnsCase(caseRecord, scopedAdvocateId);

  if (caseNo && caseNo !== caseRecord.caseNo) {
    const existing = await Case.findOne({
      where: { caseNo },
      attributes: SAFE_ATTRIBUTES,
    });
    if (existing) {
      throw new AppError('Case number is already registered', 409);
    }
  }

  if (scopedAdvocateId != null && advocateId != null && String(advocateId) !== String(scopedAdvocateId)) {
    throw new AppError('You cannot reassign a case to another advocate', 403);
  }

  if (advocateId !== undefined) {
    await assertAdvocateExists(advocateId);
  }
  if (clientId !== undefined) {
    await assertClientExists(clientId);
  }
  await validateCaseMasters(caseTypeId, caseStageId, courtId);

  const t = await sequelize.transaction();
  try {
    const oldStageId = caseRecord.caseStageId;
    const stageChanged = caseStageId !== undefined && caseStageId !== oldStageId;

    if (caseNo !== undefined) caseRecord.caseNo = caseNo;
    if (title !== undefined) caseRecord.title = title;
    if (status) caseRecord.status = status;
    if (court !== undefined) caseRecord.court = court || null;
    if (nextHearing !== undefined) caseRecord.nextHearing = nextHearing || null;
    if (advocateId !== undefined && scopedAdvocateId == null) {
      caseRecord.advocateId = advocateId || null;
    }
    if (clientId !== undefined) caseRecord.clientId = clientId || null;
    if (caseTypeId !== undefined) caseRecord.caseTypeId = caseTypeId || null;
    if (caseStageId !== undefined) caseRecord.caseStageId = caseStageId || null;
    if (courtId !== undefined) caseRecord.courtId = courtId || null;
    if (approvalLevel !== undefined) caseRecord.approvalLevel = approvalLevel;

    await caseRecord.save({ transaction: t });

    if (stageChanged) {
      await CaseStageHistory.create({
        caseId: caseRecord.id,
        oldStageId,
        newStageId: caseStageId,
        remarks: 'Stage Transition Update',
        changedBy: user?.id || null,
      }, { transaction: t });
    }

    await t.commit();
    return getCaseById(caseRecord.id, { advocateId: scopedAdvocateId });
  } catch (error) {
    await t.rollback();
    throw error;
  }
};

const deleteCase = async (id, { advocateId } = {}) => {
  const caseRecord = await Case.findByPk(id, {
    attributes: SAFE_ATTRIBUTES,
  });

  if (!caseRecord) {
    throw new AppError('Case not found', 404);
  }

  assertAdvocateOwnsCase(caseRecord, advocateId);

  await caseRecord.destroy();
  return true;
};

module.exports = {
  getAllCases,
  getCaseById,
  createCase,
  updateCase,
  deleteCase,
};
