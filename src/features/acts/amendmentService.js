const { Op } = require('sequelize');
const { Amendment } = require('../associations');

const SAFE_ATTRIBUTES = [
  'id',
  'sourceAct',
  'targetAct',
  'oldSection',
  'oldTitle',
  'newSection',
  'newTitle',
  'effectiveDate',
  'created_by',
  'updated_by',
  'created_at',
  'updated_at',
];

const toPublicAmendment = (amendment) => {
  const plain = amendment.get ? amendment.get({ plain: true }) : { ...amendment };
  plain.createdBy = plain.created_by || plain.createdBy;
  plain.updatedBy = plain.updated_by || plain.updatedBy;
  plain.createdAt = plain.created_at || plain.createdAt;
  plain.updatedAt = plain.updated_at || plain.updatedAt;
  return plain;
};

const buildAmendmentFilters = ({ name, abbreviation, section, q, search, sourceAct, targetAct, effectiveDate } = {}) => {
  const where = {};
  const and = [];

  if (sourceAct) {
    where.sourceAct = sourceAct;
  }
  if (targetAct) {
    where.targetAct = targetAct;
  }
  if (effectiveDate) {
    where.effectiveDate = effectiveDate;
  }

  if (name) {
    and.push({
      [Op.or]: [
        { sourceAct: { [Op.like]: `%${name}%` } },
        { targetAct: { [Op.like]: `%${name}%` } },
      ],
    });
  }

  if (abbreviation) {
    and.push({
      [Op.or]: [
        { sourceAct: { [Op.like]: `%${abbreviation}%` } },
        { targetAct: { [Op.like]: `%${abbreviation}%` } },
      ],
    });
  }

  if (section) {
    const sectionTerm = String(section).trim();
    and.push({
      [Op.or]: [
        { oldSection: { [Op.like]: `%${sectionTerm}%` } },
        { newSection: { [Op.like]: `%${sectionTerm}%` } },
      ],
    });
  }

  const general = (q || search || '').trim();
  if (general) {
    and.push({
      [Op.or]: [
        { sourceAct: { [Op.like]: `%${general}%` } },
        { targetAct: { [Op.like]: `%${general}%` } },
        { oldSection: { [Op.like]: `%${general}%` } },
        { newSection: { [Op.like]: `%${general}%` } },
        { oldTitle: { [Op.like]: `%${general}%` } },
        { newTitle: { [Op.like]: `%${general}%` } },
      ],
    });
  }

  if (and.length) where[Op.and] = and;
  return where;
};

const getAllAmendments = async (filters = {}) => {
  const { limit, offset, ...rest } = filters;
  const { User } = require('../associations');
  const options = {
    attributes: SAFE_ATTRIBUTES,
    where: buildAmendmentFilters(rest),
    include: [
      { model: User, as: 'creator', attributes: ['id', 'name'] },
      { model: User, as: 'updater', attributes: ['id', 'name'] },
    ],
    order: [
      ['sourceAct', 'ASC'],
      ['id', 'ASC'],
    ],
  };

  if (limit !== undefined) {
    options.limit = Number(limit);
  }
  if (offset !== undefined) {
    options.offset = Number(offset);
  }

  // If paginating, perform count queries
  if (limit !== undefined || offset !== undefined) {
    const { rows, count } = await Amendment.findAndCountAll(options);
    return {
      amendments: rows.map(toPublicAmendment),
      totalCount: count,
    };
  }

  const amendments = await Amendment.findAll(options);
  return amendments.map(toPublicAmendment);
};

const getAmendmentById = async (id) => {
  const { User } = require('../associations');
  const amendment = await Amendment.findByPk(id, {
    attributes: SAFE_ATTRIBUTES,
    include: [
      { model: User, as: 'creator', attributes: ['id', 'name'] },
      { model: User, as: 'updater', attributes: ['id', 'name'] },
    ],
  });
  if (!amendment) {
    throw new AppError('Amendment not found', 404);
  }
  return toPublicAmendment(amendment);
};

const createAmendment = async ({
  sourceAct,
  targetAct,
  oldSection,
  oldTitle,
  newSection,
  newTitle,
  effectiveDate,
  createdBy,
  updatedBy,
}) => {
  const amendment = await Amendment.create({
    sourceAct,
    targetAct,
    oldSection,
    oldTitle,
    newSection,
    newTitle,
    effectiveDate: effectiveDate || null,
    createdBy,
    updatedBy,
  });
  return getAmendmentById(amendment.id);
};

const updateAmendment = async (
  id,
  { sourceAct, targetAct, oldSection, oldTitle, newSection, newTitle, effectiveDate, updatedBy }
) => {
  const amendment = await Amendment.findByPk(id);
  if (!amendment) {
    throw new AppError('Amendment not found', 404);
  }

  if (sourceAct !== undefined) amendment.sourceAct = sourceAct;
  if (targetAct !== undefined) amendment.targetAct = targetAct;
  if (oldSection !== undefined) amendment.oldSection = oldSection;
  if (oldTitle !== undefined) amendment.oldTitle = oldTitle;
  if (newSection !== undefined) amendment.newSection = newSection;
  if (newTitle !== undefined) amendment.newTitle = newTitle;
  if (effectiveDate !== undefined) amendment.effectiveDate = effectiveDate || null;
  if (updatedBy !== undefined) amendment.updatedBy = updatedBy;

  await amendment.save();
  return getAmendmentById(amendment.id);
};

const deleteAmendment = async (id) => {
  const amendment = await Amendment.findByPk(id);
  if (!amendment) {
    throw new AppError('Amendment not found', 404);
  }
  await amendment.destroy();
  return true;
};

const parseCsv = (buffer) => {
  const text = buffer.toString('utf8');
  const lines = text.split(/\r?\n/);
  if (lines.length < 2) return [];

  const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''));
  const rows = [];

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    const values = [];
    let insideQuote = false;
    let currentVal = '';
    
    for (let j = 0; j < line.length; j++) {
      const char = line[j];
      if (char === '"') {
        insideQuote = !insideQuote;
      } else if (char === ',' && !insideQuote) {
        values.push(currentVal.trim());
        currentVal = '';
      } else {
        currentVal += char;
      }
    }
    values.push(currentVal.trim());

    const rowObj = {};
    headers.forEach((h, idx) => {
      rowObj[h] = values[idx] ? values[idx].replace(/^"|"$/g, '') : '';
    });
    rows.push(rowObj);
  }
  return rows;
};

const parseExcel = async (buffer) => {
  const ExcelJS = require('exceljs');
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(buffer);
  
  const worksheet = workbook.worksheets[0];
  if (!worksheet) return [];

  const rows = [];
  const headers = [];
  
  worksheet.eachRow((row, rowNumber) => {
    if (rowNumber === 1) {
      row.values.forEach((val, colNumber) => {
        if (colNumber > 0) headers[colNumber] = String(val).trim();
      });
    } else {
      const rowObj = {};
      row.values.forEach((val, colNumber) => {
        if (colNumber > 0 && headers[colNumber]) {
          let textVal = val;
          if (val && typeof val === 'object' && val.text) textVal = val.text;
          rowObj[headers[colNumber]] = textVal != null ? String(textVal).trim() : '';
        }
      });
      rows.push(rowObj);
    }
  });
  return rows;
};

const mapRow = (rawRow) => {
  const row = {};
  Object.entries(rawRow).forEach(([key, val]) => {
    const cleanKey = key.toLowerCase().replace(/[^a-z0-9]/g, '');
    if (cleanKey === 'sourceact' || cleanKey === 'oldact') row.sourceAct = val;
    else if (cleanKey === 'targetact' || cleanKey === 'newact') row.targetAct = val;
    else if (cleanKey === 'oldsection' || cleanKey === 'sectionold') row.oldSection = val;
    else if (cleanKey === 'oldtitle' || cleanKey === 'titleold') row.oldTitle = val;
    else if (cleanKey === 'newsection' || cleanKey === 'sectionnew') row.newSection = val;
    else if (cleanKey === 'newtitle' || cleanKey === 'titlenew') row.newTitle = val;
    else if (cleanKey === 'effectivedate' || cleanKey === 'date') row.effectiveDate = val;
  });
  return row;
};

const importAmendments = async (fileBuffer, mimeType, filename, userId = null) => {
  const path = require('path');
  const ext = path.extname(filename).toLowerCase();
  
  let rawRows = [];
  if (ext === '.csv') {
    rawRows = parseCsv(fileBuffer);
  } else if (ext === '.xlsx') {
    rawRows = await parseExcel(fileBuffer);
  } else {
    throw new AppError('Only CSV (.csv) and Excel (.xlsx) files are allowed.', 400);
  }

  let imported = 0;
  let duplicates = 0;
  const errors = [];

  for (let i = 0; i < rawRows.length; i++) {
    const rawRow = rawRows[i];
    const row = mapRow(rawRow);
    const rowNum = i + 2;

    if (!row.sourceAct || !row.targetAct || !row.oldSection || !row.oldTitle || !row.newSection || !row.newTitle) {
      errors.push(`Row ${rowNum}: Missing required fields.`);
      continue;
    }

    const sAct = String(row.sourceAct).trim();
    const tAct = String(row.targetAct).trim();
    const oSec = String(row.oldSection).trim();
    const oTtl = String(row.oldTitle).trim();
    const nSec = String(row.newSection).trim();
    const nTtl = String(row.newTitle).trim();
    let effDate = row.effectiveDate ? String(row.effectiveDate).trim() : null;

    if (effDate) {
      const dateVal = new Date(effDate);
      if (Number.isNaN(dateVal.getTime())) {
        errors.push(`Row ${rowNum}: Invalid date format for "${effDate}".`);
        continue;
      }
      effDate = dateVal.toISOString().split('T')[0];
    }

    try {
      const match = await Amendment.findOne({
        where: {
          sourceAct: sAct,
          targetAct: tAct,
          oldSection: oSec,
          newSection: nSec,
        }
      });

      if (match) {
        duplicates++;
        continue;
      }

      await Amendment.create({
        sourceAct: sAct,
        targetAct: tAct,
        oldSection: oSec,
        oldTitle: oTtl,
        newSection: nSec,
        newTitle: nTtl,
        effectiveDate: effDate || '2024-07-01',
        createdBy: userId,
        updatedBy: userId,
      });
      imported++;
    } catch (dbErr) {
      errors.push(`Row ${rowNum}: Database error (${dbErr.message})`);
    }
  }

  return {
    totalRows: rawRows.length,
    imported,
    duplicates,
    errors,
  };
};

module.exports = {
  getAllAmendments,
  getAmendmentById,
  createAmendment,
  updateAmendment,
  deleteAmendment,
  importAmendments,
};
