const { CEIL } = require('../utils');

/**
 * Court Fee Calculator for Gujarat (GJ)
 * 
 * NOTE: This implementation is strictly designed for Functional Compatibility 
 * with the Century Law Firm calculator based on manually verified outputs.
 * It has NOT been independently verified against the statutory 
 * Gujarat Court-Fees Act schedule.
 */

const META = {
  stateCode: 'GJ',
  stateName: 'Gujarat',
  version: 1,
  lastUpdated: '2026-08-07',
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
 * Calculates the Court Fee for a Money Suit in Gujarat based on CLF functional parity.
 * 
 * @param {number} v - Suit Value
 * @returns {number} The calculated court fee
 */
function calculateCourtFee(v) {
  const { isValid } = validateInput(v);
  if (!isValid) {
    throw new Error('Invalid suit value for GJ Court Fee calculation');
  }

  let fee = 0;
  
  if (v <= 10000) {
    fee = CEIL(v, 100) * 0.10;
  } else if (v <= 15000) {
    fee = 1250;
  } else if (v <= 20000) {
    fee = 1500;
  } else if (v <= 50000) {
    fee = 1450 + CEIL(v - 20000, 1000) * 0.075;
  } else if (v <= 51000) {
    fee = 4000;
  } else if (v <= 60000) {
    fee = 4300;
  } else if (v <= 70000) {
    fee = 4900;
  } else if (v <= 75000) {
    fee = 5200;
  } else if (v <= 100000) {
    fee = 5950;
  } else if (v <= 1000000) {
    fee = 5950 + CEIL(v - 100000, 100000) * 0.02;
  } else if (v <= 2000000) {
    fee = 23950 + CEIL(v - 1000000, 200000) * 0.012;
  } else {
    fee = 35950 + CEIL(v - 2000000, 100000) * 0.005;
  }

  if (fee > 75000) {
    fee = 75000;
  }

  return Math.round(fee * 100) / 100;
}

module.exports = {
  META,
  calculateCourtFee,
  validateInput,
};
