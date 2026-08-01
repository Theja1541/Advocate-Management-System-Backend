const { Op } = require('sequelize');

/**
 * Dedicated Court Fee Calculator Service (CLF Reference Parity Engine)
 * Supports SINGLE_SLAB, MARGINAL_CUMULATIVE, FIXED, and PERCENTAGE calculations.
 * Implements backend validations (overlapping slabs, duplicate active rules, percentage limits)
 * and calculates exact itemized court fees, advocate fees, process/filing/misc fees, and total payable.
 */

/**
 * Validate effective date range
 */
const validateEffectiveDates = (effectiveFrom, effectiveTo) => {
  if (!effectiveFrom) {
    throw new Error('Effective From date is required.');
  }
  if (effectiveTo && new Date(effectiveFrom) > new Date(effectiveTo)) {
    throw new Error('Effective From date cannot be after Effective To date.');
  }
};

/**
 * Validate relational slabs for overlapping ranges, valid amounts, and percentage limits.
 */
const validateSlabs = (slabs = []) => {
  if (!Array.isArray(slabs) || slabs.length === 0) {
    throw new Error('Slab-wise rule requires at least one slab definition.');
  }

  // Sort slabs by fromAmount ascending
  const sorted = [...slabs].sort((a, b) => Number(a.fromAmount) - Number(b.fromAmount));

  for (let i = 0; i < sorted.length; i++) {
    const current = sorted[i];
    const fromAmt = Number(current.fromAmount);
    const toAmt = current.toAmount !== null && current.toAmount !== undefined && current.toAmount !== '' 
      ? Number(current.toAmount) 
      : null;
    const feeVal = Number(current.feeValue);
    const minFee = Number(current.minFee || 0);
    const maxFee = Number(current.maxFee || 0);

    if (isNaN(fromAmt) || fromAmt < 0) {
      throw new Error(`Slab #${i + 1}: From Amount must be a non-negative number.`);
    }

    if (toAmt !== null) {
      if (isNaN(toAmt) || toAmt <= fromAmt) {
        throw new Error(`Slab #${i + 1}: To Amount (${toAmt}) must be strictly greater than From Amount (${fromAmt}).`);
      }
    }

    if (current.feeType === 'PERCENTAGE') {
      if (isNaN(feeVal) || feeVal < 0 || feeVal > 100) {
        throw new Error(`Slab #${i + 1}: Percentage rate must be between 0% and 100%. Received: ${feeVal}%`);
      }
    } else {
      if (isNaN(feeVal) || feeVal < 0) {
        throw new Error(`Slab #${i + 1}: Fixed fee value must be a non-negative number.`);
      }
    }

    if (minFee < 0 || maxFee < 0) {
      throw new Error(`Slab #${i + 1}: Minimum and Maximum fees must be non-negative.`);
    }

    if (maxFee > 0 && minFee > maxFee) {
      throw new Error(`Slab #${i + 1}: Minimum fee (${minFee}) cannot exceed Maximum fee (${maxFee}).`);
    }

    // Check for overlapping slabs with previous slab
    if (i > 0) {
      const prev = sorted[i - 1];
      const prevToAmt = prev.toAmount !== null && prev.toAmount !== undefined && prev.toAmount !== ''
        ? Number(prev.toAmount)
        : null;

      if (prevToAmt === null) {
        throw new Error(`Slab #${i}: Previous slab has no upper bound (unlimited). No additional slabs can follow an unlimited slab.`);
      }

      if (fromAmt < prevToAmt) {
        throw new Error(`Slab overlap detected: Slab starting at ₹${fromAmt.toLocaleString('en-IN')} overlaps with previous slab ending at ₹${prevToAmt.toLocaleString('en-IN')}.`);
      }
    }
  }
};

/**
 * Validate duplicate active rules for same state code in overlapping date range
 */
const validateDuplicateActiveRule = async (StateCourtFeeRule, stateCode, effectiveFrom, effectiveTo, excludeRuleId = null) => {
  const whereClause = {
    stateCode: stateCode.toUpperCase().trim(),
    isActive: true,
  };

  if (excludeRuleId) {
    whereClause.id = { [Op.ne]: excludeRuleId };
  }

  const existingRules = await StateCourtFeeRule.findAll({ where: whereClause });

  const newFrom = new Date(effectiveFrom);
  const newTo = effectiveTo ? new Date(effectiveTo) : null;

  for (const rule of existingRules) {
    const ruleFrom = new Date(rule.effectiveFrom);
    const ruleTo = rule.effectiveTo ? new Date(rule.effectiveTo) : null;

    const isSeparated = (newTo && newTo < ruleFrom) || (ruleTo && newFrom > ruleTo);
    if (!isSeparated) {
      throw new Error(
        `Active court fee rule conflict: An active rule (#${rule.id}) already exists for ${stateCode} starting ${rule.effectiveFrom}${rule.effectiveTo ? ' to ' + rule.effectiveTo : ' (open-ended)'}.`
      );
    }
  }
};

/**
 * Core Court Fee Calculation Logic (CLF Parity Engine)
 */
const calculateCourtFee = (rule, suitValueInput, advocateFeePctOverride = null) => {
  if (!rule) {
    throw new Error('Court fee calculation rule is missing or null.');
  }

  const suitValue = Math.max(0, Number(suitValueInput) || 0);
  let courtFee = 0;
  let formulaExplanation = '';
  let matchedSlab = null;

  const ruleType = rule.ruleType;
  const calculationMode = rule.calculationMode || 'MARGINAL_CUMULATIVE';

  if (ruleType === 'FIXED') {
    courtFee = Number(rule.fixedAmount || 0);
    formulaExplanation = `Fixed Court Fee of ₹${courtFee.toLocaleString('en-IN')} applied.`;
  } else if (ruleType === 'PERCENTAGE') {
    const rate = Number(rule.percentageRate || 0);
    courtFee = (suitValue * rate) / 100;
    formulaExplanation = `Ad-valorem ${rate}% on suit value ₹${suitValue.toLocaleString('en-IN')} = ₹${courtFee.toLocaleString('en-IN')}`;

    const minFee = Number(rule.minFee || 0);
    const maxFee = Number(rule.maxFee || 0);

    if (minFee > 0 && courtFee < minFee) {
      courtFee = minFee;
      formulaExplanation += ` (capped at Minimum Fee ₹${minFee.toLocaleString('en-IN')})`;
    } else if (maxFee > 0 && courtFee > maxFee) {
      courtFee = maxFee;
      formulaExplanation += ` (capped at Maximum Fee ₹${maxFee.toLocaleString('en-IN')})`;
    }
  } else if (ruleType === 'SLAB') {
    const slabs = (rule.slabs || []).sort((a, b) => Number(a.fromAmount) - Number(b.fromAmount));
    
    if (slabs.length === 0) {
      throw new Error('No slab details defined for this slab-wise rule.');
    }

    // Find applicable slab tier for suit value
    for (const slab of slabs) {
      const from = Number(slab.fromAmount);
      const to = slab.toAmount !== null && slab.toAmount !== undefined && slab.toAmount !== '' 
        ? Number(slab.toAmount) 
        : Infinity;

      if (suitValue >= from && suitValue <= to) {
        matchedSlab = slab;
        break;
      }
    }

    if (!matchedSlab) {
      matchedSlab = slabs[slabs.length - 1];
    }

    const feeVal = Number(matchedSlab.feeValue || 0);
    const baseFee = Number(matchedSlab.minFee || 0); // Base fee accumulated from previous tiers
    const slabFrom = Number(matchedSlab.fromAmount || 0);
    const slabTo = matchedSlab.toAmount !== null && matchedSlab.toAmount !== undefined ? Number(matchedSlab.toAmount) : null;
    const rangeStr = slabTo !== null
      ? `₹${slabFrom.toLocaleString('en-IN')} – ₹${slabTo.toLocaleString('en-IN')}`
      : `Above ₹${slabFrom.toLocaleString('en-IN')}`;

    if (calculationMode === 'MARGINAL_CUMULATIVE') {
      if (matchedSlab.feeType === 'PERCENTAGE') {
        const threshold = slabFrom > 0 ? slabFrom - 1 : 0;
        const excessAmount = Math.max(0, suitValue - threshold);
        const marginalFee = (excessAmount * feeVal) / 100;
        courtFee = baseFee + marginalFee;

        if (baseFee > 0) {
          formulaExplanation = `CLF Cumulative Schedule (${rangeStr}): Base Fee ₹${baseFee.toLocaleString('en-IN')} + ${feeVal}% on excess ₹${excessAmount.toLocaleString('en-IN')} = ₹${courtFee.toLocaleString('en-IN')}`;
        } else {
          formulaExplanation = `CLF Schedule (${rangeStr}): ${feeVal}% on ₹${suitValue.toLocaleString('en-IN')} = ₹${courtFee.toLocaleString('en-IN')}`;
        }
      } else {
        courtFee = baseFee + feeVal;
        formulaExplanation = `CLF Schedule (${rangeStr}): Fixed Tier Fee ₹${courtFee.toLocaleString('en-IN')}`;
      }
    } else {
      // SINGLE_SLAB mode
      if (matchedSlab.feeType === 'PERCENTAGE') {
        courtFee = (suitValue * feeVal) / 100;
        formulaExplanation = `Slab Tier (${rangeStr}): ${feeVal}% on ₹${suitValue.toLocaleString('en-IN')} = ₹${courtFee.toLocaleString('en-IN')}`;
      } else {
        courtFee = feeVal;
        formulaExplanation = `Slab Tier (${rangeStr}): Fixed Fee ₹${courtFee.toLocaleString('en-IN')}`;
      }

      if (baseFee > 0 && courtFee < baseFee) {
        courtFee = baseFee;
        formulaExplanation += ` (capped at Slab Min Fee ₹${baseFee.toLocaleString('en-IN')})`;
      }
    }

    // Apply rule level maximum fee capping if configured
    const ruleMaxFee = Number(rule.maxFee || 0);
    if (ruleMaxFee > 0 && courtFee > ruleMaxFee) {
      courtFee = ruleMaxFee;
      formulaExplanation += ` (capped at Maximum Court Fee ₹${ruleMaxFee.toLocaleString('en-IN')})`;
    }
  }

  // Calculate separate additional charges
  const processFee = Math.max(0, Number(rule.processFee || 0));
  const filingFee = Math.max(0, Number(rule.filingFee || 0));
  const miscCharges = Math.max(0, Number(rule.miscCharges || 0));
  const totalAdditionalCharges = processFee + filingFee + miscCharges;

  // Calculate Advocate Fee
  const advocateFeePct = advocateFeePctOverride !== null && advocateFeePctOverride !== undefined
    ? Number(advocateFeePctOverride)
    : Number(rule.defaultAdvocateFeePct || 10);

  const advocateFee = (suitValue * advocateFeePct) / 100;

  const totalAmount = courtFee + advocateFee + totalAdditionalCharges;

  return {
    suitValue,
    courtFee: Math.round(courtFee * 100) / 100,
    advocateFeePct,
    advocateFee: Math.round(advocateFee * 100) / 100,
    processFee,
    filingFee,
    miscCharges,
    totalAdditionalCharges,
    totalAmount: Math.round(totalAmount * 100) / 100,
    ruleType,
    calculationMode,
    stateCode: rule.stateCode,
    stateName: rule.stateName,
    actDetails: {
      actName: rule.actName || 'State Court Fees Act',
      actVersion: rule.actVersion || '—',
      notificationNo: rule.notificationNo || '—',
      effectiveFrom: rule.effectiveFrom,
      effectiveTo: rule.effectiveTo || 'Present',
    },
    formulaExplanation,
    notes: rule.notes || '',
    matchedSlab,
  };
};

module.exports = {
  validateEffectiveDates,
  validateSlabs,
  validateDuplicateActiveRule,
  calculateCourtFee,
};
