const { Reference, User } = require('../associations');
const AppError = require('../../utils/AppError');

const SAFE_ATTRIBUTES = [
  'id',
  'citation',
  'title',
  'court',
  'judge',
  'type',
  'tag',
  'note',
  'createdBy',
  'created_at',
];

const toPublicReference = (reference) => {
  const plain = reference.get ? reference.get({ plain: true }) : { ...reference };
  return plain;
};

const assertUserExists = async (userId, fieldLabel) => {
  if (userId == null) return;
  const user = await User.findByPk(userId, { attributes: ['id'] });
  if (!user) throw new AppError(`${fieldLabel} user not found`, 400);
};

const { isGroupAdmin } = require('../../utils/roleHelper');

const getAllReferences = async (currentUser = null) => {
  const where = {};
  if (currentUser && isGroupAdmin(currentUser.role)) {
    where.createdBy = currentUser.id;
  }

  const references = await Reference.findAll({
    where,
    attributes: SAFE_ATTRIBUTES,
    order: [['id', 'ASC']],
  });
  return references.map(toPublicReference);
};


const getReferenceById = async (id) => {
  const reference = await Reference.findByPk(id, {
    attributes: SAFE_ATTRIBUTES,
  });
  if (!reference) throw new AppError('Reference not found', 404);
  return toPublicReference(reference);
};

const createReference = async ({
  citation,
  title,
  court,
  judge,
  type,
  tag,
  note,
  createdBy,
}) => {
  await assertUserExists(createdBy, 'createdBy');

  const existing = await Reference.findOne({
    where: { citation },
    attributes: ['id'],
  });
  if (existing) {
    throw new AppError('Citation is already registered', 409);
  }

  const reference = await Reference.create({
    citation,
    title,
    court,
    judge: judge || '—',
    type,
    tag,
    note,
    createdBy: createdBy || null,
  });

  return getReferenceById(reference.id);
};

const updateReference = async (
  id,
  { citation, title, court, judge, type, tag, note }
) => {
  const reference = await Reference.findByPk(id, {
    attributes: SAFE_ATTRIBUTES,
  });
  if (!reference) throw new AppError('Reference not found', 404);

  if (citation !== undefined && citation !== reference.citation) {
    const existing = await Reference.findOne({
      where: { citation },
      attributes: ['id'],
    });
    if (existing) {
      throw new AppError('Citation is already registered', 409);
    }
    reference.citation = citation;
  }

  if (title !== undefined) reference.title = title;
  if (court !== undefined) reference.court = court;
  if (judge !== undefined) reference.judge = judge || '—';
  if (type !== undefined) reference.type = type;
  if (tag !== undefined) reference.tag = tag;
  if (note !== undefined) reference.note = note;

  await reference.save();
  return getReferenceById(reference.id);
};

const deleteReference = async (id) => {
  const reference = await Reference.findByPk(id, {
    attributes: SAFE_ATTRIBUTES,
  });
  if (!reference) throw new AppError('Reference not found', 404);
  await reference.destroy();
  return true;
};

module.exports = {
  getAllReferences,
  getReferenceById,
  createReference,
  updateReference,
  deleteReference,
};
