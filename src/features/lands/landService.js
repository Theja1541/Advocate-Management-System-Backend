const { Land, Client, Case, User } = require('../associations');
const AppError = require('../../utils/AppError');

const SAFE_ATTRIBUTES = [
  'id',
  'surveyNo',
  'clientId',
  'village',
  'mandal',
  'district',
  'extent',
  'classification',
  'pattaNo',
  'encumbranceStatus',
  'titleStatus',
  'caseId',
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

const caseInclude = {
  model: Case,
  as: 'case',
  attributes: ['id', 'caseNo', 'title'],
};

const toPublicLand = (land) => {
  const plain = land.get ? land.get({ plain: true }) : { ...land };
  return plain;
};

const assertClientExists = async (clientId) => {
  const client = await Client.findByPk(clientId, { attributes: ['id'] });
  if (!client) throw new AppError('Client not found', 400);
};

const assertCaseExists = async (caseId) => {
  if (caseId == null) return;
  const caseRecord = await Case.findByPk(caseId, { attributes: ['id'] });
  if (!caseRecord) throw new AppError('Case not found', 400);
};

const assertUserExists = async (userId, fieldLabel) => {
  if (userId == null) return;
  const user = await User.findByPk(userId, { attributes: ['id'] });
  if (!user) throw new AppError(`${fieldLabel} user not found`, 400);
};

const getAllLands = async () => {
  const lands = await Land.findAll({
    attributes: SAFE_ATTRIBUTES,
    include: [clientInclude, caseInclude],
    order: [['id', 'ASC']],
  });
  return lands.map(toPublicLand);
};

const getLandById = async (id) => {
  const land = await Land.findByPk(id, {
    attributes: SAFE_ATTRIBUTES,
    include: [clientInclude, caseInclude],
  });
  if (!land) throw new AppError('Land record not found', 404);
  return toPublicLand(land);
};

const createLand = async ({
  surveyNo,
  clientId,
  village,
  mandal,
  district,
  extent,
  classification,
  pattaNo,
  encumbranceStatus,
  titleStatus,
  caseId,
  createdBy,
  updatedBy,
}) => {
  await assertClientExists(clientId);
  await assertCaseExists(caseId);
  await assertUserExists(createdBy, 'createdBy');
  await assertUserExists(updatedBy, 'updatedBy');

  const land = await Land.create({
    surveyNo,
    clientId,
    village,
    mandal,
    district,
    extent,
    classification,
    pattaNo,
    encumbranceStatus: encumbranceStatus || 'clear',
    titleStatus: titleStatus || 'clear',
    caseId: caseId || null,
    createdBy: createdBy || null,
    updatedBy: updatedBy || null,
  });

  return getLandById(land.id);
};

const updateLand = async (
  id,
  {
    surveyNo,
    clientId,
    village,
    mandal,
    district,
    extent,
    classification,
    pattaNo,
    encumbranceStatus,
    titleStatus,
    caseId,
    updatedBy,
  }
) => {
  const land = await Land.findByPk(id, { attributes: SAFE_ATTRIBUTES });
  if (!land) throw new AppError('Land record not found', 404);

  if (clientId !== undefined) {
    await assertClientExists(clientId);
    land.clientId = clientId;
  }
  if (caseId !== undefined) {
    await assertCaseExists(caseId);
    land.caseId = caseId || null;
  }
  if (updatedBy !== undefined) {
    await assertUserExists(updatedBy, 'updatedBy');
    land.updatedBy = updatedBy;
  }

  if (surveyNo !== undefined) land.surveyNo = surveyNo;
  if (village !== undefined) land.village = village;
  if (mandal !== undefined) land.mandal = mandal;
  if (district !== undefined) land.district = district;
  if (extent !== undefined) land.extent = extent;
  if (classification !== undefined) land.classification = classification;
  if (pattaNo !== undefined) land.pattaNo = pattaNo;
  if (encumbranceStatus) land.encumbranceStatus = encumbranceStatus;
  if (titleStatus) land.titleStatus = titleStatus;

  await land.save();
  return getLandById(land.id);
};

const deleteLand = async (id) => {
  const land = await Land.findByPk(id, { attributes: SAFE_ATTRIBUTES });
  if (!land) throw new AppError('Land record not found', 404);
  await land.destroy();
  return true;
};

module.exports = {
  getAllLands,
  getLandById,
  createLand,
  updateLand,
  deleteLand,
};
