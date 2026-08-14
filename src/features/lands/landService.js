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
  'subDivisionNo',
  'sro',
  'registrationDistrict',
  'documentNo',
  'documentYear',
  'registrationDate',
  'acquisitionType',
  'currentOwnerName',
  'remarks',
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

const { getScopedAdvocateIds } = require('../../utils/advocateScope');
const { isGroupAdmin } = require('../../utils/roleHelper');
const { Op } = require('sequelize');

const getAllLands = async (currentUser = null) => {
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
        const cases = await Case.findAll({
          where: { advocateId: { [Op.in]: allowedAdvocateIds } },
          attributes: ['id'],
        });
        const caseIds = cases.map((c) => c.id);
        if (caseIds.length === 0) {
          return [];
        }
        where.caseId = { [Op.in]: caseIds };
      }
    }
  }


  const lands = await Land.findAll({
    where,
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
  subDivisionNo,
  sro,
  registrationDistrict,
  documentNo,
  documentYear,
  registrationDate,
  acquisitionType,
  currentOwnerName,
  remarks,
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
    subDivisionNo: subDivisionNo || null,
    sro: sro || null,
    registrationDistrict: registrationDistrict || null,
    documentNo: documentNo || null,
    documentYear: documentYear ? Number(documentYear) : null,
    registrationDate: registrationDate || null,
    acquisitionType: acquisitionType || null,
    currentOwnerName: currentOwnerName || null,
    remarks: remarks || null,
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
    subDivisionNo,
    sro,
    registrationDistrict,
    documentNo,
    documentYear,
    registrationDate,
    acquisitionType,
    currentOwnerName,
    remarks,
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
  
  if (subDivisionNo !== undefined) land.subDivisionNo = subDivisionNo || null;
  if (sro !== undefined) land.sro = sro || null;
  if (registrationDistrict !== undefined) land.registrationDistrict = registrationDistrict || null;
  if (documentNo !== undefined) land.documentNo = documentNo || null;
  if (documentYear !== undefined) land.documentYear = documentYear ? Number(documentYear) : null;
  if (registrationDate !== undefined) land.registrationDate = registrationDate || null;
  if (acquisitionType !== undefined) land.acquisitionType = acquisitionType || null;
  if (currentOwnerName !== undefined) land.currentOwnerName = currentOwnerName || null;
  if (remarks !== undefined) land.remarks = remarks || null;

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
