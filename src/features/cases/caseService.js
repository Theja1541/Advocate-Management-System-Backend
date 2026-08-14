const { Op } = require('sequelize');
const { Case, Advocate, Client, CaseType, CaseStage, CaseStageHistory, Court, StateCourtFeeRule } = require('../associations');
const courtFeeService = require('../court-fees/courtFee.service');
const AppError = require('../../utils/AppError');
const { assertAdvocateOwnsCase, getScopedAdvocateIds, assertUserCanAccessAdvocateData } = require('../../utils/advocateScope');
const { isGroupAdmin, isTenantAdmin, isSuperAdmin, isAdvocate } = require('../../utils/roleHelper');

const assertAdminOwnsCase = (caseRecord, currentUser) => {
  if (!currentUser) return;
  if (isSuperAdmin(currentUser.role)) return;

  if (isTenantAdmin(currentUser.role)) {
    if (caseRecord.contextType !== 'TENANT_ADMIN' || String(caseRecord.contextId) !== String(currentUser.id)) {
      throw new AppError('Access denied: You can only modify your own Tenant Admin cases', 403);
    }
    return;
  }

  if (isGroupAdmin(currentUser.role)) {
    if (caseRecord.contextType !== 'GROUP_ADMIN' || String(caseRecord.contextId) !== String(currentUser.id)) {
      throw new AppError('Access denied: You can only modify your own Group Admin cases', 403);
    }
    return;
  }
};

const assertAdvocateExists = async (advocateId) => {
  if (advocateId == null) return;
  const advocate = await Advocate.findByPk(advocateId, { attributes: ['id'] });
  if (!advocate) throw new AppError('Assigned advocate not found', 400);
};

const assertClientExists = async (clientId) => {
  if (clientId == null) return;
  const client = await Client.findByPk(clientId, { attributes: ['id'] });
  if (!client) throw new AppError('Client not found', 400);
};

const validateCaseMasters = async (caseTypeId, caseStageId, courtId) => {
  if (caseTypeId) {
    const caseType = await CaseType.findByPk(caseTypeId, { attributes: ['id'] });
    if (!caseType) throw new AppError('Invalid case type', 400);
  }
  if (caseStageId) {
    const caseStage = await CaseStage.findByPk(caseStageId, { attributes: ['id'] });
    if (!caseStage) throw new AppError('Invalid case stage', 400);
  }
  if (courtId) {
    const court = await Court.findByPk(courtId, { attributes: ['id'] });
    if (!court) throw new AppError('Invalid court', 400);
  }
};

const SAFE_ATTRIBUTES = [
  'id',
  'tenantId',
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
  'suitValue',
  'feePercentage',
  'advocateFee',
  'courtFee',
  'processFee',
  'filingFee',
  'miscCharges',
  'totalPayable',
  'feeCalculationStatus',
  'courtFeeSnapshot',
  'createdBy',
  'updatedBy',
  'created_at',
  'updated_at',
  'contextType',
  'contextId',
];

const caseIncludes = [
  { model: Advocate, as: 'assignedAdvocate', attributes: ['id', 'name', 'email'] },
  { model: Client, as: 'client', attributes: ['id', 'name', 'clientCode'] },
  { model: CaseType, as: 'caseType', attributes: ['id', 'name', 'code'] },
  { model: CaseStage, as: 'currentStage', attributes: ['id', 'name', 'code', 'displayOrder'] },
  { model: Court, as: 'assignedCourt', attributes: ['id', 'name', 'code', 'stateCode'] },
];


const toPublicCase = (c) => {
  const plain = c.get ? c.get({ plain: true }) : { ...c };
  if (plain.assignedAdvocate) {
    plain.advocate = plain.assignedAdvocate;
  }
  if (plain.assignedCourt) {
    plain.courtDetails = plain.assignedCourt;
  }
  return plain;
};

const getAllCases = async ({ advocateId } = {}, currentUser = null) => {
  const where = {};
  if (advocateId != null) {
    where.advocateId = advocateId;
    if (currentUser && currentUser.adminContext) {
      where.contextType = currentUser.adminContext.type;
      where.contextId = currentUser.adminContext.id;
    }
  }

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

  const cases = await Case.findAll({
    where,
    attributes: SAFE_ATTRIBUTES,
    include: caseIncludes,
    order: [['id', 'ASC']],
  });
  return cases.map(toPublicCase);
};


const getCaseById = async (id, { advocateId } = {}, currentUser = null) => {
  const caseRecord = await Case.findByPk(id, {
    attributes: SAFE_ATTRIBUTES,
    include: caseIncludes,
  });

  if (!caseRecord) {
    throw new AppError('Case not found', 404);
  }

  assertAdvocateOwnsCase(caseRecord, advocateId);
  if (currentUser) {
    await assertUserCanAccessAdvocateData(caseRecord.advocateId, currentUser);
    
    if (currentUser.adminContext) {
      if (caseRecord.contextType && (caseRecord.contextType !== currentUser.adminContext.type || String(caseRecord.contextId) !== String(currentUser.adminContext.id))) {
        throw new AppError('Access denied: Case belongs to a different Admin Context', 403);
      }
    }
  }

  return toPublicCase(caseRecord);
};


const calculateFeeForCase = async (courtId, inputs) => {
  const { suitValue, feePercentage, processFee, filingFee, miscCharges } = inputs;
  const sv = Number(suitValue) || 0;
  const fp = Number(feePercentage) || 0;
  const pf = Number(processFee) || 0;
  const ff = Number(filingFee) || 0;
  const mc = Number(miscCharges) || 0;

  const result = {
    suitValue: sv,
    feePercentage: fp,
    advocateFee: (sv * fp) / 100,
    courtFee: 0,
    processFee: pf,
    filingFee: ff,
    miscCharges: mc,
    totalPayable: 0,
    feeCalculationStatus: 'PENDING',
    courtFeeSnapshot: null,
    warning: null,
  };

  let court = null;
  if (courtId) {
    court = await Court.findByPk(courtId);
  }

  if (court && court.stateCode) {
    try {
      const resultData = courtFeeService.calculateCourtFee(court.stateCode, sv);
      if (!resultData.supported) {
        result.totalPayable = result.advocateFee + pf + ff + mc;
        result.feeCalculationStatus = 'PARTIAL';
        result.warning = resultData.message || 'Court fee calculation is not yet available for this state.';
      } else {
        const courtFee = resultData.courtFee;
        const advocateFee = (sv * fp) / 100;
        
        result.advocateFee = advocateFee;
        result.courtFee = courtFee;
        result.processFee = pf;
        result.filingFee = ff;
        result.miscCharges = mc;
        result.totalPayable = advocateFee + courtFee + pf + ff + mc;
        result.feeCalculationStatus = 'COMPLETE';
      }
    } catch (err) {
      result.totalPayable = result.advocateFee + pf + ff + mc;
      result.feeCalculationStatus = 'ERROR';
      result.warning = `Calculation error: ${err.message}`;
    }
  } else {
    result.totalPayable = result.advocateFee + pf + ff + mc;
    result.feeCalculationStatus = 'PARTIAL';
    result.warning = 'Court fee could not be calculated because the selected court has no assigned state.';
  }

  return result;
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
    suitValue,
    feePercentage,
    processFee,
    filingFee,
    miscCharges,
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

  const feeResult = await calculateFeeForCase(courtId, { suitValue, feePercentage, processFee, filingFee, miscCharges });

  let contextType = null;
  let contextId = null;
  
  if (user) {
    if (user.adminContext) {
      contextType = user.adminContext.type;
      contextId = user.adminContext.id;
    } else if (isGroupAdmin(user.role)) {
      contextType = 'GROUP_ADMIN';
      contextId = user.id;
    } else if (isTenantAdmin(user.role)) {
      contextType = 'TENANT_ADMIN';
      contextId = user.id;
    }
  }

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
      suitValue: feeResult.suitValue,
      feePercentage: feeResult.feePercentage,
      advocateFee: feeResult.advocateFee,
      courtFee: feeResult.courtFee,
      processFee: feeResult.processFee,
      filingFee: feeResult.filingFee,
      miscCharges: feeResult.miscCharges,
      totalPayable: feeResult.totalPayable,
      feeCalculationStatus: feeResult.feeCalculationStatus,
      courtFeeSnapshot: feeResult.courtFeeSnapshot,
      contextType,
      contextId,
      createdBy: user?.id || null,
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
    const returnedCase = await getCaseById(caseRecord.id, { advocateId: scopedAdvocateId });
    if (feeResult.warning) {
      returnedCase.warning = feeResult.warning;
    }
    return returnedCase;
  } catch (error) {
    await t.rollback();
    throw error;
  }
};

const updateCase = async (
  id,
  { caseNo, title, status, court, nextHearing, advocateId, clientId, caseTypeId, caseStageId, courtId, approvalLevel, suitValue, feePercentage, processFee, filingFee, miscCharges },
  { advocateId: scopedAdvocateId, user } = {}
) => {
  const caseRecord = await Case.findByPk(id, {
    attributes: SAFE_ATTRIBUTES,
  });

  if (!caseRecord) {
    throw new AppError('Case not found', 404);
  }

  assertAdvocateOwnsCase(caseRecord, scopedAdvocateId);
  if (user) {
    if (user.adminContext) {
      if (caseRecord.contextType && (caseRecord.contextType !== user.adminContext.type || String(caseRecord.contextId) !== String(user.adminContext.id))) {
        throw new AppError('Access denied: Case belongs to a different Admin Context', 403);
      }
    } else {
      assertAdminOwnsCase(caseRecord, user);
    }
  }

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

  const oldStageId = caseRecord.caseStageId;
  const stageChanged = caseStageId !== undefined && caseStageId !== oldStageId;

  const shouldRecalculate = (
    (courtId !== undefined && courtId !== caseRecord.courtId) ||
    (suitValue !== undefined && Number(suitValue) !== Number(caseRecord.suitValue)) ||
    (feePercentage !== undefined && Number(feePercentage) !== Number(caseRecord.feePercentage)) ||
    (processFee !== undefined && Number(processFee) !== Number(caseRecord.processFee)) ||
    (filingFee !== undefined && Number(filingFee) !== Number(caseRecord.filingFee)) ||
    (miscCharges !== undefined && Number(miscCharges) !== Number(caseRecord.miscCharges))
  );

  let warning = null;
  let feeResult = null;
  if (shouldRecalculate) {
    const inputs = {
      suitValue: suitValue !== undefined ? suitValue : caseRecord.suitValue,
      feePercentage: feePercentage !== undefined ? feePercentage : caseRecord.feePercentage,
      processFee: processFee !== undefined ? processFee : caseRecord.processFee,
      filingFee: filingFee !== undefined ? filingFee : caseRecord.filingFee,
      miscCharges: miscCharges !== undefined ? miscCharges : caseRecord.miscCharges,
    };
    const finalCourtId = courtId !== undefined ? courtId : caseRecord.courtId;
    feeResult = await calculateFeeForCase(finalCourtId, inputs);
  }

  const t = await sequelize.transaction();
  try {
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

    if (feeResult) {
      caseRecord.suitValue = feeResult.suitValue;
      caseRecord.feePercentage = feeResult.feePercentage;
      caseRecord.advocateFee = feeResult.advocateFee;
      caseRecord.courtFee = feeResult.courtFee;
      caseRecord.processFee = feeResult.processFee;
      caseRecord.filingFee = feeResult.filingFee;
      caseRecord.miscCharges = feeResult.miscCharges;
      caseRecord.totalPayable = feeResult.totalPayable;
      caseRecord.feeCalculationStatus = feeResult.feeCalculationStatus;
      caseRecord.courtFeeSnapshot = feeResult.courtFeeSnapshot;
      warning = feeResult.warning;
    }

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
    
    // Resolve case approval alert if it is no longer pending
    if (caseRecord.status !== 'Pending Approval') {
      await resolveAlert('Case', caseRecord.id, 'CASE_APPROVAL_PENDING');
    }

    const returnedCase = await getCaseById(caseRecord.id, { advocateId: scopedAdvocateId });
    if (warning) {
      returnedCase.warning = warning;
    }
    return returnedCase;
  } catch (error) {
    await t.rollback();
    throw error;
  }
};

const deleteCase = async (id, { advocateId } = {}, currentUser = null) => {
  const caseRecord = await Case.findByPk(id, {
    attributes: SAFE_ATTRIBUTES,
  });

  if (!caseRecord) {
    throw new AppError('Case not found', 404);
  }

  assertAdvocateOwnsCase(caseRecord, advocateId);
  if (currentUser) {
    if (currentUser.adminContext) {
      if (caseRecord.contextType && (caseRecord.contextType !== currentUser.adminContext.type || String(caseRecord.contextId) !== String(currentUser.adminContext.id))) {
        throw new AppError('Access denied: Case belongs to a different Admin Context', 403);
      }
    } else {
      assertAdminOwnsCase(caseRecord, currentUser);
    }
  }

  await caseRecord.destroy();
  await resolveAllAlertsForRecord('Case', id);
  return true;
};

module.exports = {
  getAllCases,
  getCaseById,
  createCase,
  updateCase,
  deleteCase,
};
