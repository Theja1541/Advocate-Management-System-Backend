const Alert = require('./Alert');
const AppError = require('../../utils/AppError');

const SAFE_ATTRIBUTES = [
  'id',
  'type',
  'description',
  'severity',
  'dueInfo',
  'isResolved',
  'created_at',
  'updated_at',
];

const toPublicAlert = (alert) => {
  const plain = alert.get ? alert.get({ plain: true }) : { ...alert };
  return plain;
};

const getAllAlerts = async () => {
  const alerts = await Alert.findAll({
    attributes: SAFE_ATTRIBUTES,
    order: [
      ['isResolved', 'ASC'],
      ['id', 'DESC'],
    ],
  });
  return alerts.map(toPublicAlert);
};

const getAlertById = async (id) => {
  const alert = await Alert.findByPk(id, {
    attributes: SAFE_ATTRIBUTES,
  });
  if (!alert) throw new AppError('Alert not found', 404);
  return toPublicAlert(alert);
};

const createAlert = async ({
  type,
  description,
  severity,
  dueInfo,
  isResolved,
}) => {
  const alert = await Alert.create({
    type,
    description,
    severity,
    dueInfo: dueInfo || null,
    isResolved: isResolved ?? false,
  });

  return getAlertById(alert.id);
};

const updateAlert = async (
  id,
  { type, description, severity, dueInfo, isResolved }
) => {
  const alert = await Alert.findByPk(id, { attributes: SAFE_ATTRIBUTES });
  if (!alert) throw new AppError('Alert not found', 404);

  if (type !== undefined) alert.type = type;
  if (description !== undefined) alert.description = description;
  if (severity) alert.severity = severity;
  if (dueInfo !== undefined) alert.dueInfo = dueInfo || null;
  if (isResolved !== undefined) alert.isResolved = isResolved;

  await alert.save();
  return getAlertById(alert.id);
};

const deleteAlert = async (id) => {
  const alert = await Alert.findByPk(id, { attributes: SAFE_ATTRIBUTES });
  if (!alert) throw new AppError('Alert not found', 404);
  await alert.destroy();
  return true;
};

module.exports = {
  getAllAlerts,
  getAlertById,
  createAlert,
  updateAlert,
  deleteAlert,
};
