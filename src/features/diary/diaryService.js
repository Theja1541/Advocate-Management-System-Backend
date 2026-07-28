const { Op } = require('sequelize');
const { sequelize } = require('../../config/database');
const { CaseDiary, Case, Advocate, User, Document } = require('../associations');
const AppError = require('../../utils/AppError');

const syncCaseNextHearing = async (caseId, transaction) => {
  if (!caseId) return;

  const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD

  // Find the closest future/upcoming nextHearingDate for this case
  const nextEntry = await CaseDiary.findOne({
    where: {
      caseId,
      nextHearingDate: {
        [Op.gte]: today
      }
    },
    order: [['nextHearingDate', 'ASC']],
    attributes: ['nextHearingDate'],
    transaction
  });

  const nextHearing = nextEntry ? nextEntry.nextHearingDate : null;

  await Case.update(
    { nextHearing },
    { where: { id: caseId }, transaction }
  );
};

const SAFE_ATTRIBUTES = [
  'id',
  'caseId',
  'hearingDate',
  'hearingTime',
  'advocateId',
  'courtIndex',
  'note',
  'nextHearingDate',
  'attachmentsCount',
  'createdBy',
  'updatedBy',
  'created_at',
  'updated_at',
];

const caseInclude = {
  model: Case,
  as: 'case',
  attributes: ['id', 'caseNo', 'title', 'court', 'status'],
};

const advocateInclude = {
  model: Advocate,
  as: 'advocate',
  attributes: ['id', 'name'],
};

const attachmentInclude = {
  model: Document,
  as: 'attachments',
  attributes: ['id', 'documentCode', 'name', 'fileType', 'fileSize', 'filePath', 'uploadDate'],
};

const toPublicDiary = (entry) => {
  const plain = entry.get ? entry.get({ plain: true }) : { ...entry };
  return plain;
};

const assertCaseExists = async (caseId) => {
  const caseRecord = await Case.findByPk(caseId, { attributes: ['id'] });
  if (!caseRecord) {
    throw new AppError('Case not found', 400);
  }
};

const assertAdvocateExists = async (advocateId) => {
  const advocate = await Advocate.findByPk(advocateId, { attributes: ['id'] });
  if (!advocate) {
    throw new AppError('Advocate not found', 400);
  }
};

const assertUserExists = async (userId, fieldLabel) => {
  if (userId == null) return;
  const user = await User.findByPk(userId, { attributes: ['id'] });
  if (!user) {
    throw new AppError(`${fieldLabel} user not found`, 400);
  }
};

const getAllDiaries = async ({ advocateId } = {}) => {
  const where = {};
  if (advocateId != null) {
    where.advocateId = advocateId;
  }

  const entries = await CaseDiary.findAll({
    where,
    attributes: SAFE_ATTRIBUTES,
    include: [caseInclude, advocateInclude, attachmentInclude],
    order: [
      ['hearingDate', 'DESC'],
      ['hearingTime', 'DESC'],
      ['id', 'DESC'],
    ],
  });
  return entries.map(toPublicDiary);
};

const fs = require('fs').promises;
const path = require('path');
const { formatFileSize, resolveFileType } = require('../documents/documentService');

const generateDocumentCode = async (transaction) => {
  const last = await Document.findOne({
    attributes: ['id'],
    order: [['id', 'DESC']],
    transaction,
  });
  const nextNum = Number(last?.id || 0) + 101;
  return `DC-${String(nextNum).padStart(3, '0')}`;
};

const createAttachmentsForDiary = async (diaryId, caseId, files, uploadedBy, transaction) => {
  if (!files || files.length === 0) return 0;
  const uploadDate = new Date().toISOString().slice(0, 10);

  let addedCount = 0;
  for (const file of files) {
    const documentCode = await generateDocumentCode(transaction);
    await Document.create({
      documentCode,
      name: file.originalname,
      category: 'Evidence',
      caseId,
      diaryId,
      fileType: resolveFileType(file.originalname, file.mimetype),
      fileSize: formatFileSize(file.size),
      filePath: file.path || path.join('uploads', file.filename),
      uploadedBy: uploadedBy || null,
      uploadDate,
    }, { transaction });
    addedCount++;
  }
  return addedCount;
};

const getDiaryById = async (id, { advocateId } = {}) => {
  const entry = await CaseDiary.findByPk(id, {
    attributes: SAFE_ATTRIBUTES,
    include: [caseInclude, advocateInclude, attachmentInclude],
  });

  if (!entry) {
    throw new AppError('Diary entry not found', 404);
  }

  if (advocateId != null && String(entry.advocateId) !== String(advocateId)) {
    throw new AppError('You can only access diary entries for your matters', 403);
  }

  return toPublicDiary(entry);
};

const createDiary = async (
  {
    caseId,
    hearingDate,
    hearingTime,
    advocateId,
    courtIndex,
    note,
    nextHearingDate,
    createdBy,
    updatedBy,
    files,
  },
  { advocateId: scopedAdvocateId } = {}
) => {
  const resolvedAdvocateId =
    scopedAdvocateId != null ? scopedAdvocateId : advocateId;

  if (
    scopedAdvocateId != null &&
    advocateId != null &&
    String(advocateId) !== String(scopedAdvocateId)
  ) {
    throw new AppError('You can only create diary entries for yourself', 403);
  }

  await assertCaseExists(caseId);
  await assertAdvocateExists(resolvedAdvocateId);
  await assertUserExists(createdBy, 'createdBy');
  await assertUserExists(updatedBy, 'updatedBy');

  const t = await sequelize.transaction();

  try {
    const entry = await CaseDiary.create({
      caseId,
      hearingDate,
      hearingTime,
      advocateId: resolvedAdvocateId,
      courtIndex,
      note,
      nextHearingDate: nextHearingDate || null,
      attachmentsCount: 0,
      createdBy: createdBy || null,
      updatedBy: updatedBy || null,
    }, { transaction: t });

    const filesCount = await createAttachmentsForDiary(entry.id, caseId, files, createdBy, t);
    entry.attachmentsCount = filesCount;
    await entry.save({ transaction: t });

    await syncCaseNextHearing(caseId, t);

    await t.commit();
    return getDiaryById(entry.id, { advocateId: scopedAdvocateId });
  } catch (error) {
    await t.rollback();
    throw error;
  }
};

const updateDiary = async (
  id,
  {
    caseId,
    hearingDate,
    hearingTime,
    advocateId,
    courtIndex,
    note,
    nextHearingDate,
    updatedBy,
    files,
    retainedAttachmentIds,
  },
  { advocateId: scopedAdvocateId } = {}
) => {
  const entry = await CaseDiary.findByPk(id, {
    attributes: SAFE_ATTRIBUTES,
  });

  if (!entry) {
    throw new AppError('Diary entry not found', 404);
  }

  if (scopedAdvocateId != null && String(entry.advocateId) !== String(scopedAdvocateId)) {
    throw new AppError('You can only access diary entries for your matters', 403);
  }

  if (
    scopedAdvocateId != null &&
    advocateId != null &&
    String(advocateId) !== String(scopedAdvocateId)
  ) {
    throw new AppError('You cannot reassign a diary entry to another advocate', 403);
  }

  const oldCaseId = entry.caseId;

  if (caseId !== undefined) {
    await assertCaseExists(caseId);
  }
  if (advocateId !== undefined && scopedAdvocateId == null) {
    await assertAdvocateExists(advocateId);
  }
  if (updatedBy !== undefined) {
    await assertUserExists(updatedBy, 'updatedBy');
  }

  // Parse retainedAttachmentIds array
  let retainedIds = [];
  if (retainedAttachmentIds !== undefined) {
    if (Array.isArray(retainedAttachmentIds)) {
      retainedIds = retainedAttachmentIds.map(Number);
    } else if (typeof retainedAttachmentIds === 'string') {
      try {
        retainedIds = JSON.parse(retainedAttachmentIds).map(Number);
      } catch {
        retainedIds = String(retainedAttachmentIds).split(',').map(Number).filter(Boolean);
      }
    }
  }

  const t = await sequelize.transaction();
  let toDelete = [];

  try {
    if (caseId !== undefined) entry.caseId = caseId;
    if (advocateId !== undefined && scopedAdvocateId == null) {
      entry.advocateId = advocateId;
    }
    if (updatedBy !== undefined) entry.updatedBy = updatedBy;
    if (hearingDate !== undefined) entry.hearingDate = hearingDate;
    if (hearingTime !== undefined) entry.hearingTime = hearingTime;
    if (courtIndex !== undefined) entry.courtIndex = courtIndex;
    if (note !== undefined) entry.note = note;
    if (nextHearingDate !== undefined) entry.nextHearingDate = nextHearingDate || null;

    // Handle deleted attachments if retainedAttachmentIds was specified
    if (retainedAttachmentIds !== undefined) {
      const currentAttachments = await Document.findAll({
        where: { diaryId: id },
        attributes: ['id', 'filePath'],
        transaction: t,
      });

      toDelete = currentAttachments.filter(att => !retainedIds.includes(Number(att.id)));
      if (toDelete.length > 0) {
        await Document.destroy({
          where: { id: toDelete.map(att => att.id) },
          transaction: t,
        });
      }
    }

    // Handle new attachments
    const newFilesCount = await createAttachmentsForDiary(entry.id, entry.caseId, files, updatedBy, t);

    // Update attachmentsCount dynamically
    const finalCount = await Document.count({
      where: { diaryId: id },
      transaction: t,
    });
    entry.attachmentsCount = finalCount;

    await entry.save({ transaction: t });

    if (caseId !== undefined && caseId !== oldCaseId) {
      await syncCaseNextHearing(oldCaseId, t);
    }
    await syncCaseNextHearing(entry.caseId, t);

    await t.commit();

    // Clean up unlinked files from filesystem asynchronously after commit
    for (const att of toDelete) {
      if (att.filePath) {
        try {
          await fs.unlink(att.filePath);
        } catch {
          // ignore disk error
        }
      }
    }

    return getDiaryById(entry.id, { advocateId: scopedAdvocateId });
  } catch (error) {
    await t.rollback();
    throw error;
  }
};

const deleteDiary = async (id, { advocateId: scopedAdvocateId } = {}) => {
  const entry = await CaseDiary.findByPk(id, {
    attributes: SAFE_ATTRIBUTES,
  });

  if (!entry) {
    throw new AppError('Diary entry not found', 404);
  }

  if (scopedAdvocateId != null && String(entry.advocateId) !== String(scopedAdvocateId)) {
    throw new AppError('You can only access diary entries for your matters', 403);
  }

  // Find all attachments to clean up filesystem after DB delete
  const attachments = await Document.findAll({
    where: { diaryId: id },
    attributes: ['filePath'],
  });

  const caseId = entry.caseId;
  const t = await sequelize.transaction();

  try {
    await entry.destroy({ transaction: t });
    await syncCaseNextHearing(caseId, t);
    await t.commit();

    // Delete files from storage asynchronously
    for (const att of attachments) {
      if (att.filePath) {
        try {
          await fs.unlink(att.filePath);
        } catch {
          // ignore
        }
      }
    }
    return true;
  } catch (error) {
    await t.rollback();
    throw error;
  }
};

module.exports = {
  getAllDiaries,
  getDiaryById,
  createDiary,
  updateDiary,
  deleteDiary,
};
