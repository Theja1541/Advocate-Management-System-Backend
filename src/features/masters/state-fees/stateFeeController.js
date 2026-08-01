const { sequelize } = require('../../../config/database');
const { StateCourtFeeRule, StateCourtFeeSlab } = require('../../associations');
const AppError = require('../../../utils/AppError');
const {
  validateEffectiveDates,
  validateSlabs,
  validateDuplicateActiveRule,
  calculateCourtFee,
} = require('./courtFeeCalculator.service');

/**
 * Get all State Court Fee Rules with optional filters
 */
exports.getAllStateFees = async (req, res, next) => {
  try {
    const { activeOnly, stateCode } = req.query;

    const where = {};
    if (activeOnly === 'true' || activeOnly === true) {
      where.isActive = true;
    }
    if (stateCode) {
      where.stateCode = stateCode.toUpperCase().trim();
    }

    const rules = await StateCourtFeeRule.findAll({
      where,
      include: [
        {
          model: StateCourtFeeSlab,
          as: 'slabs',
          required: false,
        },
      ],
      order: [
        ['stateCode', 'ASC'],
        ['effectiveFrom', 'DESC'],
        [{ model: StateCourtFeeSlab, as: 'slabs' }, 'displayOrder', 'ASC'],
      ],
    });

    res.status(200).json({
      status: 'success',
      results: rules.length,
      data: { rules },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get a single State Court Fee Rule by ID
 */
exports.getStateFeeById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const rule = await StateCourtFeeRule.findByPk(id, {
      include: [
        {
          model: StateCourtFeeSlab,
          as: 'slabs',
          required: false,
        },
      ],
      order: [[{ model: StateCourtFeeSlab, as: 'slabs' }, 'displayOrder', 'ASC']],
    });

    if (!rule) {
      return next(new AppError('State court fee rule configuration not found.', 404));
    }

    res.status(200).json({
      status: 'success',
      data: { rule },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Create a new State Court Fee Rule configuration
 */
exports.createStateFeeConfig = async (req, res, next) => {
  const transaction = await sequelize.transaction();
  try {
    const {
      stateCode,
      stateName,
      ruleType,
      fixedAmount,
      percentageRate,
      minFee,
      maxFee,
      effectiveFrom,
      effectiveTo,
      actName,
      actVersion,
      notificationNo,
      defaultAdvocateFeePct,
      processFee,
      filingFee,
      miscCharges,
      isActive,
      notes,
      slabs,
    } = req.body;

    if (!stateCode || !stateName) {
      throw new AppError('State Code and State Name are required.', 400);
    }

    // 1. Validate effective date ranges
    validateEffectiveDates(effectiveFrom, effectiveTo);

    // 2. Rule type specific validations
    if (ruleType === 'PERCENTAGE') {
      const rate = Number(percentageRate);
      if (isNaN(rate) || rate < 0 || rate > 100) {
        throw new AppError('Percentage rate must be between 0% and 100%.', 400);
      }
    } else if (ruleType === 'SLAB') {
      validateSlabs(slabs);
    }

    // 3. Duplicate active rule validation
    const shouldBeActive = isActive !== false;
    if (shouldBeActive) {
      await validateDuplicateActiveRule(StateCourtFeeRule, stateCode, effectiveFrom, effectiveTo);
    }

    // 4. Create Rule Header
    const rule = await StateCourtFeeRule.create(
      {
        stateCode: stateCode.toUpperCase().trim(),
        stateName: stateName.trim(),
        ruleType: ruleType || 'PERCENTAGE',
        fixedAmount: Number(fixedAmount || 0),
        percentageRate: Number(percentageRate || 0),
        minFee: Number(minFee || 0),
        maxFee: Number(maxFee || 0),
        effectiveFrom,
        effectiveTo: effectiveTo || null,
        actName: actName ? actName.trim() : null,
        actVersion: actVersion ? actVersion.trim() : null,
        notificationNo: notificationNo ? notificationNo.trim() : null,
        defaultAdvocateFeePct: Number(defaultAdvocateFeePct ?? 10.0),
        processFee: Number(processFee ?? 500.0),
        filingFee: Number(filingFee ?? 1000.0),
        miscCharges: Number(miscCharges ?? 3000.0),
        isActive: shouldBeActive,
        notes: notes ? notes.trim() : null,
        createdBy: req.user?.id || null,
        updatedBy: req.user?.id || null,
      },
      { transaction }
    );

    // 5. Create Slabs if SLAB type
    if (ruleType === 'SLAB' && Array.isArray(slabs)) {
      const slabPayloads = slabs.map((s, idx) => ({
        ruleId: rule.id,
        fromAmount: Number(s.fromAmount || 0),
        toAmount: s.toAmount !== null && s.toAmount !== undefined && s.toAmount !== '' ? Number(s.toAmount) : null,
        feeType: s.feeType || 'PERCENTAGE',
        feeValue: Number(s.feeValue || 0),
        minFee: Number(s.minFee || 0),
        maxFee: Number(s.maxFee || 0),
        displayOrder: Number(s.displayOrder || idx + 1),
      }));
      await StateCourtFeeSlab.bulkCreate(slabPayloads, { transaction });
    }

    await transaction.commit();

    const createdRule = await StateCourtFeeRule.findByPk(rule.id, {
      include: [{ model: StateCourtFeeSlab, as: 'slabs' }],
    });

    res.status(201).json({
      status: 'success',
      data: { rule: createdRule },
    });
  } catch (error) {
    await transaction.rollback();
    next(error);
  }
};

/**
 * Update an existing State Court Fee Rule configuration
 */
exports.updateStateFeeConfig = async (req, res, next) => {
  const transaction = await sequelize.transaction();
  try {
    const { id } = req.params;
    const rule = await StateCourtFeeRule.findByPk(id);

    if (!rule) {
      throw new AppError('State court fee rule configuration not found.', 404);
    }

    const {
      stateCode,
      stateName,
      ruleType,
      fixedAmount,
      percentageRate,
      minFee,
      maxFee,
      effectiveFrom,
      effectiveTo,
      actName,
      actVersion,
      notificationNo,
      defaultAdvocateFeePct,
      processFee,
      filingFee,
      miscCharges,
      isActive,
      notes,
      slabs,
    } = req.body;

    const updatedEffectiveFrom = effectiveFrom || rule.effectiveFrom;
    const updatedEffectiveTo = effectiveTo !== undefined ? effectiveTo : rule.effectiveTo;
    const updatedRuleType = ruleType || rule.ruleType;
    const updatedStateCode = stateCode ? stateCode.toUpperCase().trim() : rule.stateCode;
    const updatedIsActive = isActive !== undefined ? isActive : rule.isActive;

    // 1. Validate effective date ranges
    validateEffectiveDates(updatedEffectiveFrom, updatedEffectiveTo);

    // 2. Rule type validations
    if (updatedRuleType === 'PERCENTAGE') {
      const rate = Number(percentageRate !== undefined ? percentageRate : rule.percentageRate);
      if (isNaN(rate) || rate < 0 || rate > 100) {
        throw new AppError('Percentage rate must be between 0% and 100%.', 400);
      }
    } else if (updatedRuleType === 'SLAB') {
      validateSlabs(slabs);
    }

    // 3. Duplicate active rule validation
    if (updatedIsActive) {
      await validateDuplicateActiveRule(
        StateCourtFeeRule,
        updatedStateCode,
        updatedEffectiveFrom,
        updatedEffectiveTo,
        id
      );
    }

    // 4. Update Rule Header
    await rule.update(
      {
        stateCode: updatedStateCode,
        stateName: stateName ? stateName.trim() : rule.stateName,
        ruleType: updatedRuleType,
        fixedAmount: fixedAmount !== undefined ? Number(fixedAmount) : rule.fixedAmount,
        percentageRate: percentageRate !== undefined ? Number(percentageRate) : rule.percentageRate,
        minFee: minFee !== undefined ? Number(minFee) : rule.minFee,
        maxFee: maxFee !== undefined ? Number(maxFee) : rule.maxFee,
        effectiveFrom: updatedEffectiveFrom,
        effectiveTo: updatedEffectiveTo || null,
        actName: actName !== undefined ? (actName ? actName.trim() : null) : rule.actName,
        actVersion: actVersion !== undefined ? (actVersion ? actVersion.trim() : null) : rule.actVersion,
        notificationNo: notificationNo !== undefined ? (notificationNo ? notificationNo.trim() : null) : rule.notificationNo,
        defaultAdvocateFeePct: defaultAdvocateFeePct !== undefined ? Number(defaultAdvocateFeePct) : rule.defaultAdvocateFeePct,
        processFee: processFee !== undefined ? Number(processFee) : rule.processFee,
        filingFee: filingFee !== undefined ? Number(filingFee) : rule.filingFee,
        miscCharges: miscCharges !== undefined ? Number(miscCharges) : rule.miscCharges,
        isActive: updatedIsActive,
        notes: notes !== undefined ? (notes ? notes.trim() : null) : rule.notes,
        updatedBy: req.user?.id || null,
      },
      { transaction }
    );

    // 5. Replace Slabs if SLAB type
    if (updatedRuleType === 'SLAB' && Array.isArray(slabs)) {
      await StateCourtFeeSlab.destroy({ where: { ruleId: id }, transaction });

      const slabPayloads = slabs.map((s, idx) => ({
        ruleId: id,
        fromAmount: Number(s.fromAmount || 0),
        toAmount: s.toAmount !== null && s.toAmount !== undefined && s.toAmount !== '' ? Number(s.toAmount) : null,
        feeType: s.feeType || 'PERCENTAGE',
        feeValue: Number(s.feeValue || 0),
        minFee: Number(s.minFee || 0),
        maxFee: Number(s.maxFee || 0),
        displayOrder: Number(s.displayOrder || idx + 1),
      }));
      await StateCourtFeeSlab.bulkCreate(slabPayloads, { transaction });
    }

    await transaction.commit();

    const updatedRule = await StateCourtFeeRule.findByPk(id, {
      include: [{ model: StateCourtFeeSlab, as: 'slabs' }],
    });

    res.status(200).json({
      status: 'success',
      data: { rule: updatedRule },
    });
  } catch (error) {
    await transaction.rollback();
    next(error);
  }
};

/**
 * Activate a State Court Fee Rule configuration
 */
exports.activateStateFeeConfig = async (req, res, next) => {
  try {
    const { id } = req.params;
    const rule = await StateCourtFeeRule.findByPk(id);

    if (!rule) {
      return next(new AppError('State court fee rule configuration not found.', 404));
    }

    // Check duplicate active rule conflicts
    await validateDuplicateActiveRule(
      StateCourtFeeRule,
      rule.stateCode,
      rule.effectiveFrom,
      rule.effectiveTo,
      id
    );

    await rule.update({ isActive: true, updatedBy: req.user?.id || null });

    res.status(200).json({
      status: 'success',
      data: { rule },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Deactivate a State Court Fee Rule configuration
 */
exports.deactivateStateFeeConfig = async (req, res, next) => {
  try {
    const { id } = req.params;
    const rule = await StateCourtFeeRule.findByPk(id);

    if (!rule) {
      return next(new AppError('State court fee rule configuration not found.', 404));
    }

    await rule.update({ isActive: false, updatedBy: req.user?.id || null });

    res.status(200).json({
      status: 'success',
      data: { rule },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Calculate court fee for a state and suit value
 */
exports.calculateFee = async (req, res, next) => {
  try {
    const stateCode = (req.body.stateCode || req.query.stateCode || '').toUpperCase().trim();
    const suitValue = Number(req.body.suitValue ?? req.query.suitValue ?? 0);
    const advocateFeePct = req.body.advocateFeePct ?? req.query.advocateFeePct ?? null;
    const calcDateStr = req.body.calcDate || req.query.calcDate || new Date().toISOString().split('T')[0];

    if (!stateCode) {
      return next(new AppError('State Code is required for calculation.', 400));
    }

    const { Op } = require('sequelize');
    const calcDate = new Date(calcDateStr);

    // Find active rule matching state and date window
    const rules = await StateCourtFeeRule.findAll({
      where: {
        stateCode,
        isActive: true,
        effectiveFrom: { [Op.lte]: calcDateStr },
      },
      include: [{ model: StateCourtFeeSlab, as: 'slabs' }],
      order: [['effectiveFrom', 'DESC']],
    });

    const activeRule = rules.find(r => !r.effectiveTo || new Date(r.effectiveTo) >= calcDate);

    if (!activeRule) {
      return res.status(404).json({
        status: 'error',
        message: `No active court fee configuration found for state '${stateCode}' effective on ${calcDateStr}. Please configure rules in Master Settings.`,
        data: { stateCode, hasConfig: false },
      });
    }

    const result = calculateCourtFee(activeRule, suitValue, advocateFeePct);

    res.status(200).json({
      status: 'success',
      data: {
        calculation: result,
        hasConfig: true,
      },
    });
  } catch (error) {
    next(error);
  }
};
