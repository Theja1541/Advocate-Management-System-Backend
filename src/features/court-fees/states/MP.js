/**
 * Court Fee Calculator for Madhya Pradesh (MP)
 * 
 * NOTE: This implementation is strictly designed for Functional Compatibility 
 * with the Century Law Firm calculator based on manually verified outputs.
 */

const META = {
  stateCode: 'MP',
  stateName: 'Madhya Pradesh',
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
 * Calculates the Court Fee for a Money Suit in Madhya Pradesh based on CLF functional parity.
 * 
 * @param {number} v - Suit Value
 * @returns {number} The calculated court fee
 */
function calculateCourtFee(v) {
  const { isValid } = validateInput(v);
  if (!isValid) {
    throw new Error('Invalid suit value for MP Court Fee calculation');
  }

  let fee = 0;
  
  if (v <= 500000) {
    // 12% ad-valorem with a minimum fee of Rs. 100
    fee = Math.max(100, v * 0.12);
  } else if (v <= 1000000) {
    // 7% ad-valorem above 5,00,000
    fee = 60000 + (v - 500000) * 0.07;
  } else {
    // 3% ad-valorem above 10,00,000
    fee = 95000 + (v - 1000000) * 0.03;
  }

  // Maximum fee cap in Madhya Pradesh
  if (fee > 150000) {
    fee = 150000;
  }

  return Math.round(fee * 100) / 100;
}

module.exports = {
  META,
  calculateCourtFee,
  validateInput,
};
