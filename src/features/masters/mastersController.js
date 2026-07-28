const { CaseType, CaseStage, Court } = require('../associations');
const AppError = require('../../utils/AppError');

// ==========================================
// CASE TYPES CONTROLLER
// ==========================================

exports.getAllCaseTypes = async (req, res, next) => {
  try {
    const where = {};
    if (req.query.activeOnly === 'true') {
      where.isActive = true;
    }
    const types = await CaseType.findAll({
      where,
      order: [['displayOrder', 'ASC'], ['name', 'ASC']],
    });
    res.status(200).json({
      status: 'success',
      data: { caseTypes: types },
    });
  } catch (error) {
    next(error);
  }
};

exports.getCaseTypeById = async (req, res, next) => {
  try {
    const type = await CaseType.findByPk(req.params.id);
    if (!type) {
      throw new AppError('Case Type not found', 404);
    }
    res.status(200).json({
      status: 'success',
      data: { caseType: type },
    });
  } catch (error) {
    next(error);
  }
};

exports.createCaseType = async (req, res, next) => {
  try {
    const { code, name, description, displayOrder } = req.body;
    
    // Check code unique
    const existing = await CaseType.findOne({ where: { code } });
    if (existing) {
      throw new AppError('Case Type code must be unique', 400);
    }

    const type = await CaseType.create({
      code,
      name,
      description,
      displayOrder: displayOrder || 0,
      isActive: true,
      isSystem: false,
      createdBy: req.user?.id,
    });

    res.status(201).json({
      status: 'success',
      data: { caseType: type },
    });
  } catch (error) {
    next(error);
  }
};

exports.updateCaseType = async (req, res, next) => {
  try {
    const type = await CaseType.findByPk(req.params.id);
    if (!type) {
      throw new AppError('Case Type not found', 404);
    }

    const { name, description, displayOrder, isActive } = req.body;
    
    if (name !== undefined) type.name = name;
    if (description !== undefined) type.description = description;
    if (displayOrder !== undefined) type.displayOrder = displayOrder;
    if (isActive !== undefined) type.isActive = isActive;
    type.updatedBy = req.user?.id;

    await type.save();

    res.status(200).json({
      status: 'success',
      data: { caseType: type },
    });
  } catch (error) {
    next(error);
  }
};

exports.activateCaseType = async (req, res, next) => {
  try {
    const type = await CaseType.findByPk(req.params.id);
    if (!type) {
      throw new AppError('Case Type not found', 404);
    }
    type.isActive = true;
    type.updatedBy = req.user?.id;
    await type.save();

    res.status(200).json({
      status: 'success',
      data: { caseType: type },
    });
  } catch (error) {
    next(error);
  }
};

exports.deactivateCaseType = async (req, res, next) => {
  try {
    const type = await CaseType.findByPk(req.params.id);
    if (!type) {
      throw new AppError('Case Type not found', 404);
    }
    type.isActive = false;
    type.updatedBy = req.user?.id;
    await type.save();

    res.status(200).json({
      status: 'success',
      data: { caseType: type },
    });
  } catch (error) {
    next(error);
  }
};

// ==========================================
// CASE STAGES CONTROLLER
// ==========================================

exports.getAllCaseStages = async (req, res, next) => {
  try {
    const where = {};
    if (req.query.activeOnly === 'true') {
      where.isActive = true;
    }
    const stages = await CaseStage.findAll({
      where,
      order: [['displayOrder', 'ASC'], ['name', 'ASC']],
    });
    res.status(200).json({
      status: 'success',
      data: { caseStages: stages },
    });
  } catch (error) {
    next(error);
  }
};

exports.getCaseStageById = async (req, res, next) => {
  try {
    const stage = await CaseStage.findByPk(req.params.id);
    if (!stage) {
      throw new AppError('Case Stage not found', 404);
    }
    res.status(200).json({
      status: 'success',
      data: { caseStage: stage },
    });
  } catch (error) {
    next(error);
  }
};

exports.createCaseStage = async (req, res, next) => {
  try {
    const { code, name, displayOrder, color, isClosed } = req.body;

    const existing = await CaseStage.findOne({ where: { code } });
    if (existing) {
      throw new AppError('Case Stage code must be unique', 400);
    }

    const stage = await CaseStage.create({
      code,
      name,
      displayOrder: displayOrder || 0,
      color: color || 'c-grey',
      isClosed: isClosed || false,
      isActive: true,
      isSystem: false,
      createdBy: req.user?.id,
    });

    res.status(201).json({
      status: 'success',
      data: { caseStage: stage },
    });
  } catch (error) {
    next(error);
  }
};

exports.updateCaseStage = async (req, res, next) => {
  try {
    const stage = await CaseStage.findByPk(req.params.id);
    if (!stage) {
      throw new AppError('Case Stage not found', 404);
    }

    const { name, displayOrder, color, isClosed, isActive } = req.body;

    if (name !== undefined) stage.name = name;
    if (displayOrder !== undefined) stage.displayOrder = displayOrder;
    if (color !== undefined) stage.color = color;
    if (isClosed !== undefined) stage.isClosed = isClosed;
    if (isActive !== undefined) stage.isActive = isActive;
    stage.updatedBy = req.user?.id;

    await stage.save();

    res.status(200).json({
      status: 'success',
      data: { caseStage: stage },
    });
  } catch (error) {
    next(error);
  }
};

exports.activateCaseStage = async (req, res, next) => {
  try {
    const stage = await CaseStage.findByPk(req.params.id);
    if (!stage) {
      throw new AppError('Case Stage not found', 404);
    }
    stage.isActive = true;
    stage.updatedBy = req.user?.id;
    await stage.save();

    res.status(200).json({
      status: 'success',
      data: { caseStage: stage },
    });
  } catch (error) {
    next(error);
  }
};

exports.deactivateCaseStage = async (req, res, next) => {
  try {
    const stage = await CaseStage.findByPk(req.params.id);
    if (!stage) {
      throw new AppError('Case Stage not found', 404);
    }
    stage.isActive = false;
    stage.updatedBy = req.user?.id;
    await stage.save();

    res.status(200).json({
      status: 'success',
      data: { caseStage: stage },
    });
  } catch (error) {
    next(error);
  }
};

// ==========================================
// COURTS CONTROLLER
// ==========================================

exports.getAllCourts = async (req, res, next) => {
  try {
    const where = {};
    if (req.query.activeOnly === 'true') {
      where.isActive = true;
    }
    const courtsList = await Court.findAll({
      where,
      order: [['name', 'ASC']],
    });
    res.status(200).json({
      status: 'success',
      data: { courts: courtsList },
    });
  } catch (error) {
    next(error);
  }
};

exports.getCourtById = async (req, res, next) => {
  try {
    const court = await Court.findByPk(req.params.id);
    if (!court) {
      throw new AppError('Court not found', 404);
    }
    res.status(200).json({
      status: 'success',
      data: { court },
    });
  } catch (error) {
    next(error);
  }
};

exports.createCourt = async (req, res, next) => {
  try {
    const { code, name, location } = req.body;

    const existing = await Court.findOne({ where: { code } });
    if (existing) {
      throw new AppError('Court code must be unique', 400);
    }

    const court = await Court.create({
      code,
      name,
      location,
      isActive: true,
      isSystem: false,
      createdBy: req.user?.id,
    });

    res.status(201).json({
      status: 'success',
      data: { court },
    });
  } catch (error) {
    next(error);
  }
};

exports.updateCourt = async (req, res, next) => {
  try {
    const court = await Court.findByPk(req.params.id);
    if (!court) {
      throw new AppError('Court not found', 404);
    }

    const { name, location, isActive } = req.body;

    if (name !== undefined) court.name = name;
    if (location !== undefined) court.location = location;
    if (isActive !== undefined) court.isActive = isActive;
    court.updatedBy = req.user?.id;

    await court.save();

    res.status(200).json({
      status: 'success',
      data: { court },
    });
  } catch (error) {
    next(error);
  }
};

exports.activateCourt = async (req, res, next) => {
  try {
    const court = await Court.findByPk(req.params.id);
    if (!court) {
      throw new AppError('Court not found', 404);
    }
    court.isActive = true;
    court.updatedBy = req.user?.id;
    await court.save();

    res.status(200).json({
      status: 'success',
      data: { court },
    });
  } catch (error) {
    next(error);
  }
};

exports.deactivateCourt = async (req, res, next) => {
  try {
    const court = await Court.findByPk(req.params.id);
    if (!court) {
      throw new AppError('Court not found', 404);
    }
    court.isActive = false;
    court.updatedBy = req.user?.id;
    await court.save();

    res.status(200).json({
      status: 'success',
      data: { court },
    });
  } catch (error) {
    next(error);
  }
};
