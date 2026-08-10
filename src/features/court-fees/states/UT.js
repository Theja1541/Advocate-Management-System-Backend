/**
 * Court Fee Calculator for Uttarakhand (UT)
 * 
 * NOTE: This implementation is strictly designed for Functional Compatibility 
 * with the Century Law Firm calculator based on manually verified outputs.
 * 
 * The formula in the JSON rules file was found to be mathematically incorrect 
 * when compared against the CLF outputs. This implementation perfectly matches 
 * the verified CLF outputs and shares the correct UP logic.
 */

const { CEIL } = require('../utils');

const META = {
  stateCode: 'UT',
  stateName: 'Uttarakhand',
  version: 1,
  lastUpdated: '2026-08-10',
  implementationType: 'Functional Compatibility',
  reference: 'Century Law Firm Court Fee Calculator',
  verifiedAgainstReference: true,
  statutoryVerification: false
};

/**
 * Validates the input for court fee calculation.
 * @param {number} suitValue - The value of the suit
 * @returns {{ isValid: boolean, error: string|null }}
 */
function validateInput(suitValue) {
  if (suitValue === undefined || suitValue === null) {
    return { isValid: false, error: 'suitValue is required' };
  }
  const numericValue = Number(suitValue);
  if (isNaN(numericValue) || numericValue <= 0) {
    return { isValid: false, error: 'suitValue must be a positive number greater than 0' };
  }
  return { isValid: true, error: null };
}

/**
 * Calculates the Court Fee for a Money Suit in Uttarakhand based on CLF functional parity.
 * 
 * @param {number} v - Suit Value
 * @returns {number} The calculated court fee
 */
function calculateCourtFee(v) {
  const { isValid } = validateInput(v);
  if (!isValid) {
    throw new Error('Invalid suit value for UT Court Fee calculation');
  }

  let fee = 0;
  
  if (v <= 100) {
    fee = CEIL(v, 5) * 0.10;
  } else if (v <= 300) {
    fee = 10 + CEIL(v - 100, 10) * 0.125;
  } else if (v <= 500) {
    fee = 35 + CEIL(v - 300, 10) * 0.15;
  } else if (v <= 1000) {
    fee = 65 + CEIL(v - 500, 10) * 0.225;
  } else if (v <= 5000) {
    fee = 177.50 + CEIL(v - 1000, 100) * 0.12;
  } else if (v <= 10000) {
    fee = 657.50 + CEIL(v - 5000, 200) * 0.10;
  } else if (v <= 50000) {
    const excess = v - 10000;
    const thousands = Math.floor((excess - 0.01) / 1000);
    const remainder = excess - thousands * 1000;
    let feeExcess = thousands * 75;
    
    if (remainder > 0 && remainder <= 500) {
      feeExcess += 38;
    } else if (remainder > 500) {
      feeExcess += 75;
    }
    
    fee = 1157.50 + feeExcess;
  } else {
    fee = 4157.50 + CEIL(v - 50000, 500) * 0.075;
  }

  return Math.round(fee * 100) / 100;
}

module.exports = {
  META,
  calculateCourtFee,
  validateInput,
};
