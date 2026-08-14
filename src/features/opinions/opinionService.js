const { Opinion, Client, Advocate, User, Land, Document } = require('../associations');
const AppError = require('../../utils/AppError');
const fs = require('fs');
const path = require('path');
const { generateOpinionPdf } = require('./opinionPdfService');
const documentService = require('../documents/documentService');

const SAFE_ATTRIBUTES = [
  'id',
  'referenceNo',
  'clientId',
  'surveyNo',
  'village',
  'opinionType',
  'issueDate',
  'titleStatus',
  'advocateId',
  'landId',
  'findingsNote',
  'createdBy',
  'updatedBy',
  'status',
  'approvedBy',
  'approvalDate',
  'issuedBy',
  'rejectReason',
  'recommendation',
  'limitations',
  'documentId',
  'created_at',
  'updated_at',
];

const finalPdfInclude = {
  model: Document,
  as: 'finalPdf',
  attributes: ['id', 'documentCode', 'name', 'filePath', 'fileType', 'fileSize', 'uploadDate'],
};

const clientInclude = {
  model: Client,
  as: 'client',
  attributes: ['id', 'clientCode', 'name'],
};

const advocateInclude = {
  model: Advocate,
  as: 'advocate',
  attributes: ['id', 'name'],
};

const landInclude = {
  model: Land,
  as: 'land',
  attributes: ['id', 'surveyNo', 'pattaNo', 'village'],
};

const approverInclude = {
  model: User,
  as: 'approver',
  attributes: ['id', 'name', 'email'],
};

const issuerInclude = {
  model: User,
  as: 'issuer',
  attributes: ['id', 'name', 'email'],
};

const toPublicOpinion = (opinion) => {
  const plain = opinion.get ? opinion.get({ plain: true }) : { ...opinion };
  return plain;
};

const assertClientExists = async (clientId, tenantId) => {
  const client = await Client.findOne({ where: { id: clientId, tenantId } });
  if (!client) throw new AppError('Client not found', 400);
};

const assertAdvocateExists = async (advocateId, tenantId) => {
  const advocate = await Advocate.findOne({ where: { id: advocateId, tenantId } });
  if (!advocate) throw new AppError('Advocate not found', 400);
};

const assertLandExists = async (landId, tenantId) => {
  if (landId == null) return;
  const land = await Land.findOne({ where: { id: landId, tenantId } });
  if (!land) throw new AppError('Land record not found', 400);
};

const assertUserExists = async (userId, fieldLabel) => {
  if (userId == null) return;
  const user = await User.findByPk(userId, { attributes: ['id'] });
  if (!user) throw new AppError(`${fieldLabel} user not found`, 400);
};

const generateReferenceNo = async () => {
  const year = new Date().getFullYear();
  const last = await Opinion.findOne({
    attributes: ['id'],
    order: [['id', 'DESC']],
  });
  const nextNum = Number(last?.id || 0) + 1;
  return `OP-${year}/${String(nextNum).padStart(3, '0')}`;
};

const { getScopedAdvocateIds } = require('../../utils/advocateScope');
const { isGroupAdmin } = require('../../utils/roleHelper');
const { Op } = require('sequelize');

const getAllOpinions = async (tenantId, currentUser = null) => {
  const where = { tenantId };

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


  const opinions = await Opinion.findAll({
    where,
    attributes: SAFE_ATTRIBUTES,
    include: [clientInclude, advocateInclude, landInclude, approverInclude, issuerInclude, finalPdfInclude],
    order: [['id', 'DESC']],
  });
  return opinions.map(toPublicOpinion);
};

const getOpinionById = async (id, tenantId) => {
  const opinion = await Opinion.findOne({
    where: { id, tenantId },
    attributes: SAFE_ATTRIBUTES,
    include: [clientInclude, advocateInclude, landInclude, approverInclude, issuerInclude, finalPdfInclude],
  });
  if (!opinion) throw new AppError('Opinion not found', 404);
  return toPublicOpinion(opinion);
};

const createOpinion = async ({
  referenceNo,
  clientId,
  surveyNo,
  village,
  opinionType,
  issueDate,
  titleStatus,
  advocateId,
  landId,
  findingsNote,
  createdBy,
  updatedBy,
  tenantId,
}) => {
  await assertClientExists(clientId, tenantId);
  await assertAdvocateExists(advocateId, tenantId);
  await assertLandExists(landId, tenantId);
  await assertUserExists(createdBy, 'createdBy');
  await assertUserExists(updatedBy, 'updatedBy');

  let resolvedRef = referenceNo;
  if (!resolvedRef) {
    resolvedRef = await generateReferenceNo();
  }

  const existing = await Opinion.findOne({
    where: { referenceNo: resolvedRef, tenantId },
    attributes: ['id'],
  });
  if (existing) {
    throw new AppError('Opinion reference number is already registered', 409);
  }

  const opinion = await Opinion.create({
    tenantId,
    referenceNo: resolvedRef,
    clientId,
    surveyNo,
    village,
    opinionType,
    issueDate: issueDate || null,
    titleStatus: titleStatus || 'clear',
    advocateId,
    landId: landId || null,
    findingsNote,
    createdBy: createdBy || null,
    updatedBy: updatedBy || null,
    status: 'draft',
  });

  return getOpinionById(opinion.id, tenantId);
};

const updateOpinion = async (
  id,
  {
    referenceNo,
    clientId,
    surveyNo,
    village,
    opinionType,
    issueDate,
    titleStatus,
    advocateId,
    landId,
    findingsNote,
    updatedBy,
  },
  tenantId
) => {
  const opinion = await Opinion.findOne({ where: { id, tenantId } });
  if (!opinion) throw new AppError('Opinion not found', 404);

  if (opinion.status === 'issued') {
    throw new AppError('Cannot edit an issued legal opinion', 400);
  }

  // Reset rejected status to draft upon edit
  if (opinion.status === 'rejected') {
    opinion.status = 'draft';
    opinion.rejectReason = null;
  }

  if (clientId !== undefined) {
    await assertClientExists(clientId, tenantId);
    opinion.clientId = clientId;
  }
  if (advocateId !== undefined) {
    await assertAdvocateExists(advocateId, tenantId);
    opinion.advocateId = advocateId;
  }
  if (landId !== undefined) {
    await assertLandExists(landId, tenantId);
    opinion.landId = landId || null;
  }
  if (updatedBy !== undefined) {
    await assertUserExists(updatedBy, 'updatedBy');
    opinion.updatedBy = updatedBy;
  }

  if (referenceNo !== undefined && referenceNo !== opinion.referenceNo) {
    const existing = await Opinion.findOne({
      where: { referenceNo, tenantId },
      attributes: ['id'],
    });
    if (existing) {
      throw new AppError('Opinion reference number is already registered', 409);
    }
    opinion.referenceNo = referenceNo;
  }

  if (surveyNo !== undefined) opinion.surveyNo = surveyNo;
  if (village !== undefined) opinion.village = village;
  if (opinionType !== undefined) opinion.opinionType = opinionType;
  if (issueDate !== undefined) opinion.issueDate = issueDate || null;
  if (titleStatus) opinion.titleStatus = titleStatus;
  if (findingsNote !== undefined) opinion.findingsNote = findingsNote;

  await opinion.save();
  return getOpinionById(opinion.id, tenantId);
};

const deleteOpinion = async (id, tenantId) => {
  const opinion = await Opinion.findOne({ where: { id, tenantId } });
  if (!opinion) throw new AppError('Opinion not found', 404);
  if (opinion.status === 'issued') {
    throw new AppError('Cannot delete an issued legal opinion', 400);
  }
  await opinion.destroy();
  return true;
};

// Workflow actions
const submitForReview = async (id, tenantId) => {
  const opinion = await Opinion.findOne({ where: { id, tenantId } });
  if (!opinion) throw new AppError('Opinion not found', 404);

  if (opinion.status !== 'draft' && opinion.status !== 'rejected') {
    throw new AppError('Opinion must be in draft or rejected status to submit for review', 400);
  }

  opinion.status = 'pending_review';
  opinion.rejectReason = null;
  await opinion.save();
  return getOpinionById(id, tenantId);
};

const approve = async (id, approvedBy, tenantId) => {
  const opinion = await Opinion.findOne({ where: { id, tenantId } });
  if (!opinion) throw new AppError('Opinion not found', 404);

  if (opinion.status !== 'pending_review') {
    throw new AppError('Opinion must be in pending_review status to approve', 400);
  }

  await assertUserExists(approvedBy, 'approvedBy');

  opinion.status = 'approved';
  opinion.approvedBy = approvedBy;
  opinion.approvalDate = new Date();
  opinion.rejectReason = null;
  await opinion.save();
  return getOpinionById(id, tenantId);
};

const reject = async (id, rejectReason, tenantId) => {
  const opinion = await Opinion.findOne({ where: { id, tenantId } });
  if (!opinion) throw new AppError('Opinion not found', 404);

  if (opinion.status !== 'pending_review') {
    throw new AppError('Opinion must be in pending_review status to reject', 400);
  }

  if (!rejectReason || !rejectReason.trim()) {
    throw new AppError('Reject reason is required', 400);
  }

  opinion.status = 'rejected';
  opinion.rejectReason = rejectReason.trim();
  await opinion.save();
  return getOpinionById(id, tenantId);
};

const issue = async (id, issuedBy, tenantId) => {
  // Fetch opinion with associations to get land details
  const opinion = await Opinion.findOne({
    where: { id, tenantId },
    include: [{ model: Land, as: 'land' }],
  });
  if (!opinion) throw new AppError('Opinion not found', 404);

  if (opinion.status !== 'approved') {
    throw new AppError('Opinion must be approved before it can be issued', 400);
  }

  if (opinion.documentId) {
    throw new AppError('This opinion has already been issued with a final PDF document', 400);
  }

  await assertUserExists(issuedBy, 'issuedBy');

  // 1. Generate PDF
  let pdfBuffer;
  try {
    pdfBuffer = await generateOpinionPdf(id, tenantId);
  } catch (err) {
    throw new AppError(`Failed to generate final PDF: ${err.message}`, 500);
  }

  // 2. Save PDF file to upload directory
  const filename = `legal-opinion-${opinion.referenceNo.replace(/[^a-zA-Z0-9]/g, '-')}-${Date.now()}.pdf`;
  const uploadDir = path.resolve(__dirname, '../../../uploads/documents');
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }
  const filePath = path.join(uploadDir, filename);

  try {
    fs.writeFileSync(filePath, pdfBuffer);
  } catch (err) {
    throw new AppError(`Failed to write PDF file to disk: ${err.message}`, 500);
  }

  // 3. Construct file object for document creation
  const mockFile = {
    originalname: filename,
    mimetype: 'application/pdf',
    size: pdfBuffer.length,
    path: filePath,
    filename: filename,
  };

  // Resolve the dedicated "Legal Opinions" document category (tenant-scoped).
  // This category is required. If it cannot be found or created, the issue operation fails
  // and the opinion remains in approved status.
  const { DocumentCategory } = require('../associations');
  const { Op } = require('sequelize');
  let categoryId;

  // 1. Look for an existing OPINION category scoped to this tenant
  let opinionCategory = await DocumentCategory.findOne({
    where: {
      tenantId,
      [Op.or]: [{ code: 'OPINION' }, { name: 'Legal Opinions' }],
    },
  });

  // 2. Auto-create the dedicated category if it does not yet exist
  if (!opinionCategory) {
    try {
      opinionCategory = await DocumentCategory.create({
        tenantId,
        code: 'OPINION',
        name: 'Legal Opinions',
        displayOrder: 99,
        isActive: true,
        isSystem: false,
      });
    } catch (createErr) {
      // Category creation failed — clean up the PDF buffer and abort
      if (fs.existsSync(filePath)) {
        try { fs.unlinkSync(filePath); } catch {}
      }
      throw new AppError(
        `Failed to create Legal Opinions document category: ${createErr.message}`,
        500
      );
    }
  }

  categoryId = opinionCategory.id;

  // 4. Create Document record
  let document;
  try {
    document = await documentService.createDocument({
      name: `Final Legal Opinion - ${opinion.referenceNo}`,
      documentCategoryId: categoryId,
      caseId: opinion.land?.caseId || null,
      landId: opinion.landId || null,
      file: mockFile,
      uploadedBy: issuedBy,
      tenantId,
    });
  } catch (err) {
    // Cleanup written file
    if (fs.existsSync(filePath)) {
      try {
        fs.unlinkSync(filePath);
      } catch (e) {
        // ignore
      }
    }
    throw new AppError(`Failed to register PDF document: ${err.message}`, 500);
  }

  // 5. Update Opinion
  opinion.status = 'issued';
  opinion.issuedBy = issuedBy;
  opinion.issueDate = new Date().toISOString().slice(0, 10);
  opinion.documentId = document.id;
  await opinion.save();

  return getOpinionById(id, tenantId);
};

module.exports = {
  getAllOpinions,
  getOpinionById,
  createOpinion,
  updateOpinion,
  deleteOpinion,
  submitForReview,
  approve,
  reject,
  issue,
};
