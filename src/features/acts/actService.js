const path = require('path');
const fs = require('fs');
const { Op } = require('sequelize');
const { sequelize } = require('../../config/database');
const { BareAct, Amendment } = require('../associations');
const AppError = require('../../utils/AppError');
const logger = require('../../config/logger');
const storageService = require('./storageService');

const ACTS_PDF_DIR = path.resolve(__dirname, '../../../static/acts');

const SAFE_ATTRIBUTES = [
  'id',
  'name',
  'abbreviation',
  'effectiveDate',
  'type',
  'state',
  'description',
  'sectionsCount',
  'isBookmarked',
  'pdfFile',
  'pdfOriginalName',
  'pdfStorageName',
  'pdfStoragePath',
  'pdfSize',
  'mimeType',
  'fileHash',
  'versionNumber',
  'isCurrent',
  'uploadedBy',
  'uploadedAt',
  'createdBy',
  'updatedBy',
  'deletedBy',
  'deletedAt',
  'created_at',
  'updated_at',
];

const toPublicAct = (act) => {
  if (!act) return null;
  const plain = act.get ? act.get({ plain: true }) : { ...act };
  
  if (plain.pdfStorageName) {
    plain.pdfUrl = `/uploads/bare-acts/${plain.pdfStorageName}`;
  } else if (plain.pdfFile) {
    plain.pdfUrl = `/static/acts/${plain.pdfFile}`;
  } else {
    plain.pdfUrl = null;
  }
  return plain;
};

const resolvePdfPath = (act) => {
  if (act.pdfStoragePath) {
    const absolutePath = path.resolve(act.pdfStoragePath);
    const uploadDir = path.resolve(process.env.BARE_ACT_UPLOAD_DIR || 'uploads/bare-acts');
    
    if (!absolutePath.startsWith(uploadDir)) {
      throw new AppError('Invalid PDF path', 400);
    }
    if (!fs.existsSync(absolutePath)) {
      throw new AppError('Bare Act PDF not found.', 404);
    }
    return { absolutePath, filename: act.pdfOriginalName || 'document.pdf' };
  }

  const filename = act.pdfFile;
  if (!filename) {
    throw new AppError('Bare Act PDF not found.', 404);
  }
  const safeName = path.basename(filename);
  const absolutePath = path.join(ACTS_PDF_DIR, safeName);
  
  if (!absolutePath.startsWith(ACTS_PDF_DIR)) {
    throw new AppError('Invalid PDF path', 400);
  }
  if (!fs.existsSync(absolutePath)) {
    throw new AppError('Bare Act PDF not found.', 404);
  }
  return { absolutePath, filename: safeName };
};

const buildActFilters = ({ name, abbreviation, section, q, search } = {}) => {
  const where = {};
  const and = [];

  if (name) {
    and.push({ name: { [Op.like]: `%${name}%` } });
  }
  if (abbreviation) {
    and.push({ abbreviation: { [Op.like]: `%${abbreviation}%` } });
  }
  if (section) {
    const sectionTerm = String(section).trim();
    and.push({
      [Op.or]: [
        { description: { [Op.like]: `%${sectionTerm}%` } },
        { sectionsCount: Number.isFinite(Number(sectionTerm)) ? Number(sectionTerm) : -1 },
      ],
    });
  }

  const general = (q || search || '').trim();
  if (general) {
    and.push({
      [Op.or]: [
        { name: { [Op.like]: `%${general}%` } },
        { abbreviation: { [Op.like]: `%${general}%` } },
        { description: { [Op.like]: `%${general}%` } },
        { type: { [Op.like]: `%${general}%` } },
      ],
    });
  }

  if (and.length) where[Op.and] = and;
  return where;
};

const getAllActs = async (filters = {}, currentUser) => {
  const where = buildActFilters(filters);
  
  if (currentUser) {
    const { isSuperAdmin, isGroupAdmin } = require('../../utils/roleHelper');
    const isSuper = isSuperAdmin(currentUser.role);
    if (!isSuper) {
      where.tenantId = currentUser.tenantId;
    }
    if (isGroupAdmin(currentUser.role)) {
      where.createdBy = currentUser.id;
    }
  }

  const queryOptions = {
    attributes: SAFE_ATTRIBUTES,
    where,
    order: [
      ['isBookmarked', 'DESC'],
      ['name', 'ASC'],
    ],
  };

  if (filters.includeDeleted === 'true' || filters.includeDeleted === true) {
    queryOptions.paranoid = false;
  }

  const acts = await BareAct.findAll(queryOptions);
  return acts.map(toPublicAct);
};

const getActById = async (id, includeDeleted = false) => {
  const queryOptions = {
    attributes: SAFE_ATTRIBUTES,
  };
  if (includeDeleted) {
    queryOptions.paranoid = false;
  }
  const act = await BareAct.findByPk(id, queryOptions);
  if (!act) throw new AppError('Bare Act not found', 404);
  return toPublicAct(act);
};

const getActPdf = async (id) => {
  const act = await BareAct.findByPk(id, { attributes: SAFE_ATTRIBUTES, paranoid: false });
  if (!act) throw new AppError('Bare Act PDF not found.', 404);

  const { absolutePath, filename } = resolvePdfPath(act);
  logger.info(`Streaming real PDF file from disk for act: ${act.name} at path: ${absolutePath}`);
  
  return {
    act: toPublicAct(act),
    absolutePath,
    filename,
    downloadName: `${act.abbreviation}-${act.name.replace(/[^\w.\- ]+/g, '').trim()}.pdf`,
  };
};

const toggleBookmark = async ({ actId, id, bookmarked }) => {
  const resolvedId = actId ?? id;
  if (!resolvedId) throw new AppError('Act id is required', 400);

  const act = await BareAct.findByPk(resolvedId, { attributes: SAFE_ATTRIBUTES });
  if (!act) throw new AppError('Bare act not found', 404);

  if (typeof bookmarked === 'boolean') {
    act.isBookmarked = bookmarked;
  } else {
    act.isBookmarked = !act.isBookmarked;
  }

  await act.save();
  return toPublicAct(act);
};

/**
 * Creates a new Bare Act metadata record and processes an uploaded PDF
 */
const createAct = async (data, file, userId) => {
  // Validate unique abbreviation
  const existing = await BareAct.findOne({
    where: { abbreviation: data.abbreviation },
    paranoid: false,
  });
  if (existing) {
    throw new AppError(`Bare Act with abbreviation "${data.abbreviation}" already exists.`, 400);
  }

  let fileMetadata = {};
  if (file) {
    fileMetadata = await storageService.processUploadedFile(file);
  }

  const act = await BareAct.create({
    name: data.name,
    abbreviation: data.abbreviation,
    type: data.type,
    state: data.state || null,
    effectiveDate: data.effectiveDate || null,
    description: data.description || null,
    sectionsCount: Number(data.sectionsCount) || 0,
    createdBy: userId,
    updatedBy: userId,
    ...fileMetadata,
    uploadedBy: file ? userId : null,
    uploadedAt: file ? new Date() : null,
  });

  return toPublicAct(act);
};

/**
 * Updates basic metadata attributes of a Bare Act
 */
const updateAct = async (id, data, userId) => {
  const act = await BareAct.findByPk(id);
  if (!act) throw new AppError('Bare Act not found', 404);

  // Check unique abbreviation if changed
  if (data.abbreviation && data.abbreviation !== act.abbreviation) {
    const existing = await BareAct.findOne({
      where: { abbreviation: data.abbreviation },
      paranoid: false,
    });
    if (existing) {
      throw new AppError(`Bare Act with abbreviation "${data.abbreviation}" already exists.`, 400);
    }
  }

  act.name = data.name || act.name;
  act.abbreviation = data.abbreviation || act.abbreviation;
  act.type = data.type || act.type;
  act.state = data.state !== undefined ? data.state : act.state;
  act.effectiveDate = data.effectiveDate !== undefined ? data.effectiveDate : act.effectiveDate;
  act.description = data.description !== undefined ? data.description : act.description;
  act.sectionsCount = data.sectionsCount !== undefined ? Number(data.sectionsCount) : act.sectionsCount;
  act.updatedBy = userId;

  await act.save();
  return toPublicAct(act);
};

/**
 * Uploads/Replaces the PDF document for an existing Bare Act
 */
const replacePdf = async (id, file, userId) => {
  if (!file) throw new AppError('File upload is required', 400);

  const act = await BareAct.findByPk(id);
  if (!act) {
    await storageService.deleteFile(file.path);
    throw new AppError('Bare Act not found', 404);
  }

  const oldStoragePath = act.pdfStoragePath;
  const oldPdfFile = act.pdfFile;
  
  const transaction = await sequelize.transaction();
  try {
    const fileMetadata = await storageService.processUploadedFile(file);
    
    // Update model fields inside database transaction
    act.pdfOriginalName = fileMetadata.pdfOriginalName;
    act.pdfStorageName = fileMetadata.pdfStorageName;
    act.pdfStoragePath = fileMetadata.pdfStoragePath;
    act.pdfSize = fileMetadata.pdfSize;
    act.mimeType = fileMetadata.mimeType;
    act.fileHash = fileMetadata.fileHash;
    act.versionNumber = (act.versionNumber || 1) + 1;
    act.uploadedBy = userId;
    act.uploadedAt = new Date();
    act.updatedBy = userId;
    act.pdfFile = null;

    await act.save({ transaction });
    await transaction.commit();

    // Safely and asynchronously delete previous files after database transaction commits
    if (oldStoragePath) {
      await storageService.deleteFile(oldStoragePath);
    } else if (oldPdfFile) {
      const oldStaticPath = path.join(ACTS_PDF_DIR, oldPdfFile);
      try {
        await fs.promises.access(oldStaticPath);
        await fs.promises.unlink(oldStaticPath);
      } catch (err) {
        // Ignore if file doesn't exist
      }
    }

    return toPublicAct(act);
  } catch (error) {
    if (!transaction.finished) {
      await transaction.rollback();
    }
    // Delete newly uploaded file to prevent orphan file accumulation
    await storageService.deleteFile(file.path);
    throw error;
  }
};

/**
 * Soft deletes a Bare Act record and deletes the physical file
 */
const deleteAct = async (id, userId) => {
  const act = await BareAct.findByPk(id);
  if (!act) throw new AppError('Bare Act not found', 404);

  const storagePath = act.pdfStoragePath;
  const pdfFile = act.pdfFile;

  const transaction = await sequelize.transaction();
  try {
    act.deletedBy = userId;
    await act.save({ transaction });
    await act.destroy({ transaction });
    await transaction.commit();

    // Delete physical files asynchronously after successful database soft-delete
    if (storagePath) {
      await storageService.deleteFile(storagePath);
    } else if (pdfFile) {
      const staticPath = path.join(ACTS_PDF_DIR, pdfFile);
      try {
        await fs.promises.access(staticPath);
        await fs.promises.unlink(staticPath);
      } catch (err) {
        // Ignore if file doesn't exist
      }
    }

    return { message: 'Bare Act deleted successfully' };
  } catch (error) {
    if (!transaction.finished) {
      await transaction.rollback();
    }
    throw error;
  }
};

/**
 * Restores a soft-deleted Bare Act
 */
const restoreAct = async (id, userId) => {
  const act = await BareAct.findByPk(id, { paranoid: false });
  if (!act) throw new AppError('Bare Act not found', 404);

  if (!act.deletedAt) {
    throw new AppError('Bare Act is not deleted', 400);
  }

  await act.restore();
  act.deletedBy = null;
  act.updatedBy = userId;
  await act.save();

  return toPublicAct(act);
};

module.exports = {
  ACTS_PDF_DIR,
  getAllActs,
  getActById,
  getActPdf,
  toggleBookmark,
  createAct,
  updateAct,
  replacePdf,
  deleteAct,
  restoreAct,
};
