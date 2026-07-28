const { Opinion, Client, Advocate, User } = require('../associations');
const AppError = require('../../utils/AppError');

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
  'findingsNote',
  'createdBy',
  'updatedBy',
  'created_at',
  'updated_at',
];

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

const toPublicOpinion = (opinion) => {
  const plain = opinion.get ? opinion.get({ plain: true }) : { ...opinion };
  return plain;
};

const assertClientExists = async (clientId) => {
  const client = await Client.findByPk(clientId, { attributes: ['id'] });
  if (!client) throw new AppError('Client not found', 400);
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

const generateReferenceNo = async () => {
  const year = new Date().getFullYear();
  const last = await Opinion.findOne({
    attributes: ['id'],
    order: [['id', 'DESC']],
  });
  const nextNum = Number(last?.id || 0) + 1;
  return `OP-${year}/${String(nextNum).padStart(3, '0')}`;
};

const getAllOpinions = async () => {
  const opinions = await Opinion.findAll({
    attributes: SAFE_ATTRIBUTES,
    include: [clientInclude, advocateInclude],
    order: [['issueDate', 'DESC'], ['id', 'DESC']],
  });
  return opinions.map(toPublicOpinion);
};

const getOpinionById = async (id) => {
  const opinion = await Opinion.findByPk(id, {
    attributes: SAFE_ATTRIBUTES,
    include: [clientInclude, advocateInclude],
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
  findingsNote,
  createdBy,
  updatedBy,
}) => {
  await assertClientExists(clientId);
  await assertAdvocateExists(advocateId);
  await assertUserExists(createdBy, 'createdBy');
  await assertUserExists(updatedBy, 'updatedBy');

  let resolvedRef = referenceNo;
  if (!resolvedRef) {
    resolvedRef = await generateReferenceNo();
  }

  const existing = await Opinion.findOne({
    where: { referenceNo: resolvedRef },
    attributes: ['id'],
  });
  if (existing) {
    throw new AppError('Opinion reference number is already registered', 409);
  }

  const opinion = await Opinion.create({
    referenceNo: resolvedRef,
    clientId,
    surveyNo,
    village,
    opinionType,
    issueDate,
    titleStatus: titleStatus || 'clear',
    advocateId,
    findingsNote,
    createdBy: createdBy || null,
    updatedBy: updatedBy || null,
  });

  return getOpinionById(opinion.id);
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
    findingsNote,
    updatedBy,
  }
) => {
  const opinion = await Opinion.findByPk(id, { attributes: SAFE_ATTRIBUTES });
  if (!opinion) throw new AppError('Opinion not found', 404);

  if (clientId !== undefined) {
    await assertClientExists(clientId);
    opinion.clientId = clientId;
  }
  if (advocateId !== undefined) {
    await assertAdvocateExists(advocateId);
    opinion.advocateId = advocateId;
  }
  if (updatedBy !== undefined) {
    await assertUserExists(updatedBy, 'updatedBy');
    opinion.updatedBy = updatedBy;
  }

  if (referenceNo !== undefined && referenceNo !== opinion.referenceNo) {
    const existing = await Opinion.findOne({
      where: { referenceNo },
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
  if (issueDate !== undefined) opinion.issueDate = issueDate;
  if (titleStatus) opinion.titleStatus = titleStatus;
  if (findingsNote !== undefined) opinion.findingsNote = findingsNote;

  await opinion.save();
  return getOpinionById(opinion.id);
};

const deleteOpinion = async (id) => {
  const opinion = await Opinion.findByPk(id, { attributes: SAFE_ATTRIBUTES });
  if (!opinion) throw new AppError('Opinion not found', 404);
  await opinion.destroy();
  return true;
};

module.exports = {
  getAllOpinions,
  getOpinionById,
  createOpinion,
  updateOpinion,
  deleteOpinion,
};
