
/**
 * Court Fee Calculator for Delhi (DL)
 * 
 * WARNING: This implementation is NOT verified against the statutory
 * Court Fees Act schedule. It was reverse-engineered from the Century
 * Law Firm Court Fee Calculator to achieve functional parity with
 * observed field practice. Pending replacement with an authoritative
 * statutory source.
 */

const META = {
  stateCode: 'DL',
  stateName: 'Delhi',
  version: 1,
  lastUpdated: '2026-08-06',
  legislation: {
    act: 'Court Fees Act, 1870 (as applicable to NCT of Delhi)',
    amendment: 'Unknown — implementation based on observed Century Law Firm calculator outputs',
    effectiveDate: null,
    citation: 'Reverse-engineered from Century Law Firm calculator; not independently verified against statute',
    verified: false,
  },
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
 * Calculates the Court Fee for Delhi based on observed Century Law Firm behaviour.
 * 
 * @param {number} v - Suit Value
 * @returns {number} The calculated court fee
 */
function calculateCourtFee(v) {
  const { isValid } = validateInput(v);
  if (!isValid) {
    throw new Error('Invalid suit value for Delhi Court Fee calculation');
  }

  let fee = 0;

  if (v <= 500) {
    // ₹0 to ₹500: ₹10 for every ₹100 or part thereof
    fee = Math.ceil(v / 100) * 10;
  } else if (v <= 1000) {
    // ₹501 to ₹1000: ₹1.50 per ₹10 applied to the whole amount
    fee = Math.ceil(v / 10) * 1.50;
  } else if (v === 1001) {
    // Special observed boundary: ₹1001 retains the fee of ₹150
    fee = 150.00;
  } else if (v <= 5000) {
    // ₹1002 to ₹5000: ₹12.20 per ₹100 or part thereof (offset from ₹1001)
    fee = 150.00 + Math.ceil((v - 1001) / 100) * 12.20;
  } else if (v <= 10000) {
    // ₹5001 to ₹10000: ₹24.40 per ₹250 or part thereof
    fee = 638.00 + Math.ceil((v - 5000) / 250) * 24.40;
  } else if (v <= 20000) {
    // ₹10001 to ₹20000: ₹36.50 per ₹500 or part thereof
    fee = 1126.00 + Math.ceil((v - 10000) / 500) * 36.50;
  } else if (v <= 30000) {
    // ₹20001 to ₹30000: ₹48.80 per ₹1000 or part thereof
    fee = 1856.00 + Math.ceil((v - 20000) / 1000) * 48.80;
  } else if (v <= 50000) {
    // ₹30001 to ₹50000: ₹24.40 per ₹1000 or part thereof
    fee = 2344.00 + Math.ceil((v - 30000) / 1000) * 24.40;
  } else {
    // Above ₹50000: ₹48.80 per ₹5000 or part thereof
    fee = 2832.00 + Math.ceil((v - 50000) / 5000) * 48.80;
  }

  return Math.round(fee * 100) / 100;
}

module.exports = {
  META,
  calculateCourtFee,
  validateInput,
};
