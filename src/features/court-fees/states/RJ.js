/**
 * Court Fee Calculator for Rajasthan (RJ)
 * 
 * NOTE: This implementation is strictly designed for Functional Compatibility 
 * with the Century Law Firm calculator based on manually verified outputs.
 * It has NOT been independently verified against the statutory 
 * Rajasthan Court Fees Act schedule.
 */

const META = {
  stateCode: 'RJ',
  stateName: 'Rajasthan',
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
 * Calculates the Court Fee for a Money Suit in Rajasthan based on CLF functional parity.
 * Uses continuous marginal rates.
 * 
 * @param {number} v - Suit Value
 * @returns {number} The calculated court fee
 */
function calculateCourtFee(v) {
  const { isValid } = validateInput(v);
  if (!isValid) {
    throw new Error('Invalid suit value for RJ Court Fee calculation');
  }

  let fee = 0;
  
  if (v <= 15000) {
    fee = v * 0.025;
  } else if (v <= 75000) {
    fee = 375 + (v - 15000) * 0.075;
  } else if (v <= 250000) {
    fee = 4875 + (v - 75000) * 0.07;
  } else if (v <= 500000) {
    fee = 17125 + (v - 250000) * 0.065;
  } else if (v <= 750000) {
    fee = 33375 + (v - 500000) * 0.06;
  } else if (v <= 1000000) {
    fee = 48375 + (v - 750000) * 0.055;
  } else if (v <= 1500000) {
    fee = 62125 + (v - 1000000) * 0.05;
  } else if (v <= 2000000) {
    fee = 87125 + (v - 1500000) * 0.045;
  } else if (v <= 2500000) {
    fee = 109625 + (v - 2000000) * 0.04;
  } else if (v <= 3000000) {
    fee = 129625 + (v - 2500000) * 0.035;
  } else if (v <= 4000000) {
    fee = 147125 + (v - 3000000) * 0.03;
  } else {
    fee = 177125 + (v - 4000000) * 0.025;
  }

  // The Century Law Firm calculator uses standard JS Math.round which produces specific
  // rounding artifacts at certain floating point boundaries (e.g. 17125.06).
  // We mirror this exactly.
  return Math.round(fee * 100) / 100;
}

module.exports = {
  META,
  calculateCourtFee,
  validateInput,
};
