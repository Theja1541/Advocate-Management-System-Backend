/**
 * Court Fee Calculator for Punjab (PB)
 * 
 * NOTE: This implementation is strictly designed for Functional Compatibility 
 * with the Century Law Firm calculator based on manually verified outputs.
 */

const META = {
  stateCode: 'PB',
  stateName: 'Punjab',
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
 * Calculates the Court Fee for a Money Suit in Punjab based on CLF functional parity.
 * 
 * @param {number} v - Suit Value
 * @returns {number} The calculated court fee
 */
function calculateCourtFee(v) {
  const { isValid } = validateInput(v);
  if (!isValid) {
    throw new Error('Invalid suit value for PB Court Fee calculation');
  }

  let fee = 0;
  
  if (v <= 10000) {
    fee = v * 0.025;
  } else if (v <= 20000) {
    fee = 250 + (v - 10000) * 0.035;
  } else if (v <= 30000) {
    fee = 600 + (v - 20000) * 0.045;
  } else if (v <= 40000) {
    fee = 1050 + (v - 30000) * 0.055;
  } else if (v <= 50000) {
    fee = 1600 + (v - 40000) * 0.065;
  } else if (v <= 60000) {
    fee = 2250 + (v - 50000) * 0.075;
  } else if (v <= 75000) {
    fee = 3000 + (v - 60000) * 0.065;
  } else if (v <= 100000) {
    fee = 3975 + (v - 75000) * 0.055;
  } else if (v <= 200000) {
    fee = 5350 + (v - 100000) * 0.035;
  } else {
    // Permanent plateau of 2.25% with no maximum cap
    fee = 8850 + (v - 200000) * 0.0225;
  }

  // Punjab uses continuous floating-point calculation without ceiling steps
  return Math.round(fee * 100) / 100;
}

module.exports = {
  META,
  calculateCourtFee,
  validateInput,
};
