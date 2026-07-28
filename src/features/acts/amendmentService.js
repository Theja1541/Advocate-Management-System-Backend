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
  'created_at',
  'updated_at',
];

const toPublicAmendment = (amendment) => {
  const plain = amendment.get ? amendment.get({ plain: true }) : { ...amendment };
  return plain;
};

const buildAmendmentFilters = ({ name, abbreviation, section, q, search } = {}) => {
  const where = {};
  const and = [];

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
  const amendments = await Amendment.findAll({
    attributes: SAFE_ATTRIBUTES,
    where: buildAmendmentFilters(filters),
    order: [
      ['sourceAct', 'ASC'],
      ['id', 'ASC'],
    ],
  });
  return amendments.map(toPublicAmendment);
};

module.exports = {
  getAllAmendments,
};
