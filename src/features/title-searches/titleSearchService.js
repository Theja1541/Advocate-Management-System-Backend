const { LandTitleSearch, Land, User } = require('../associations');
const AppError = require('../../utils/AppError');

const SAFE_ATTRIBUTES = [
  'id',
  'tenantId',
  'landId',
  'searchDate',
  'periodFrom',
  'periodTo',
  'ecStatus',
  'ecReferenceNo',
  'revenueRecordsVerified',
  'registrationRecordsVerified',
  'litigationChecked',
  'documentsVerified',
  'remarks',
  'conductedBy',
  'created_at',
  'updated_at',
];

const landInclude = {
  model: Land,
  as: 'land',
  attributes: ['id', 'surveyNo', 'pattaNo', 'village'],
};

const userInclude = {
  model: User,
  as: 'conductedByUser',
  attributes: ['id', 'name', 'email', 'roleId'],
};

const toPublicTitleSearch = (search) => {
  const plain = search.get ? search.get({ plain: true }) : { ...search };
  return plain;
};

const assertLandExists = async (landId) => {
  const land = await Land.findByPk(landId, { attributes: ['id'] });
  if (!land) throw new AppError('Land record not found', 400);
};

const assertUserExists = async (userId) => {
  const user = await User.findByPk(userId, { attributes: ['id'] });
  if (!user) throw new AppError('Conducted by user not found', 400);
};

const getAllTitleSearches = async (tenantId) => {
  const searches = await LandTitleSearch.findAll({
    where: { tenantId },
    attributes: SAFE_ATTRIBUTES,
    include: [landInclude, userInclude],
    order: [['searchDate', 'DESC'], ['id', 'DESC']],
  });
  return searches.map(toPublicTitleSearch);
};

const getTitleSearchById = async (id, tenantId) => {
  const search = await LandTitleSearch.findOne({
    where: { id, tenantId },
    attributes: SAFE_ATTRIBUTES,
    include: [landInclude, userInclude],
  });
  if (!search) throw new AppError('Title search record not found', 404);
  return toPublicTitleSearch(search);
};

const createTitleSearch = async ({
  landId,
  searchDate,
  periodFrom,
  periodTo,
  ecStatus,
  ecReferenceNo,
  revenueRecordsVerified,
  registrationRecordsVerified,
  litigationChecked,
  documentsVerified,
  remarks,
  conductedBy,
}, tenantId) => {
  await assertLandExists(landId);
  await assertUserExists(conductedBy);

  const search = await LandTitleSearch.create({
    tenantId,
    landId,
    searchDate,
    periodFrom,
    periodTo,
    ecStatus: ecStatus || 'clear',
    ecReferenceNo: ecReferenceNo || null,
    revenueRecordsVerified: !!revenueRecordsVerified,
    registrationRecordsVerified: !!registrationRecordsVerified,
    litigationChecked: !!litigationChecked,
    documentsVerified: !!documentsVerified,
    remarks: remarks || null,
    conductedBy,
  });

  return getTitleSearchById(search.id, tenantId);
};

const updateTitleSearch = async (
  id,
  {
    landId,
    searchDate,
    periodFrom,
    periodTo,
    ecStatus,
    ecReferenceNo,
    revenueRecordsVerified,
    registrationRecordsVerified,
    litigationChecked,
    documentsVerified,
    remarks,
    conductedBy,
  },
  tenantId
) => {
  const search = await LandTitleSearch.findOne({
    where: { id, tenantId },
    attributes: SAFE_ATTRIBUTES,
  });
  if (!search) throw new AppError('Title search record not found', 404);

  if (landId !== undefined) {
    await assertLandExists(landId);
    search.landId = landId;
  }
  if (conductedBy !== undefined) {
    await assertUserExists(conductedBy);
    search.conductedBy = conductedBy;
  }

  if (searchDate !== undefined) search.searchDate = searchDate;
  if (periodFrom !== undefined) search.periodFrom = periodFrom;
  if (periodTo !== undefined) search.periodTo = periodTo;
  if (ecStatus !== undefined) search.ecStatus = ecStatus;
  if (ecReferenceNo !== undefined) search.ecReferenceNo = ecReferenceNo || null;
  if (revenueRecordsVerified !== undefined) search.revenueRecordsVerified = !!revenueRecordsVerified;
  if (registrationRecordsVerified !== undefined) search.registrationRecordsVerified = !!registrationRecordsVerified;
  if (litigationChecked !== undefined) search.litigationChecked = !!litigationChecked;
  if (documentsVerified !== undefined) search.documentsVerified = !!documentsVerified;
  if (remarks !== undefined) search.remarks = remarks || null;

  await search.save();
  return getTitleSearchById(search.id, tenantId);
};

const deleteTitleSearch = async (id, tenantId) => {
  const search = await LandTitleSearch.findOne({
    where: { id, tenantId },
    attributes: SAFE_ATTRIBUTES,
  });
  if (!search) throw new AppError('Title search record not found', 404);
  await search.destroy();
  return true;
};

module.exports = {
  getAllTitleSearches,
  getTitleSearchById,
  createTitleSearch,
  updateTitleSearch,
  deleteTitleSearch,
};
