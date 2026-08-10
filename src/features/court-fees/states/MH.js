const { CEIL } = require('../utils');

/**
 * Court Fee Calculator for Maharashtra (MH)
 * 
 * NOTE: This implementation is strictly designed for Functional Compatibility 
 * with the Century Law Firm calculator based on manually verified outputs.
 * It has NOT been independently verified against the statutory 
 * Maharashtra Court-Fees Act schedule.
 */

const META = {
  stateCode: 'MH',
  stateName: 'Maharashtra',
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
 * Calculates the Court Fee for a Money Suit in Maharashtra based on CLF functional parity.
 * 
 * @param {number} v - Suit Value
 * @returns {number} The calculated court fee
 */
function calculateCourtFee(v) {
  const { isValid } = validateInput(v);
  if (!isValid) {
    throw new Error('Invalid suit value for MH Court Fee calculation');
  }

  let fee = 0;
  
  if (v <= 1000) { 
    fee = 200; 
  }
  else if (v <= 5000) { 
    fee = 200 + CEIL(v - 1000, 100) * 0.12; 
  }
  else if (v <= 10000) { 
    fee = 680 + CEIL(v - 5000, 100) * 0.15; 
  }
  else if (v <= 20000) { 
    fee = 1430 + CEIL(v - 10000, 500) * 0.15; 
  }
  else if (v <= 30000) { 
    fee = 2930 + CEIL(v - 20000, 1000) * 0.10; 
  }
  else if (v <= 50000) { 
    fee = 3930 + CEIL(v - 30000, 2000) * 0.05; 
  }
  else if (v <= 100000) { 
    fee = 4930 + CEIL(v - 50000, 5000) * 0.03; 
  }
  else if (v <= 1100000) { 
    fee = 6430 + CEIL(v - 100000, 10000) * 0.02; 
  }
  else { 
    fee = 26430 + CEIL(v - 1100000, 100000) * 0.012; 
  }

  // Maximum fee cap is ₹300,000
  if (fee > 300000) {
    fee = 300000;
  }

  return Math.round(fee * 100) / 100;
}

module.exports = {
  META,
  calculateCourtFee,
  validateInput,
};
