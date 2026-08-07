/**
 * Court Fee Calculator Registry
 * 
 * Explicit registry of all supported state court fee calculators.
 * New states are added by importing the module and adding it to the map.
 */

const AP = require('./states/AP');
const TG = require('./states/TG');
const DL = require('./states/DL');
const KA = require('./states/KA');

/**
 * Explicit map of state codes to calculator modules.
 * TS is an alias for TG (frontend uses TS for Telangana, backend file is TG).
 */
const calculators = {
  'AP': AP,
  'TG': TG,
  'TS': TG,
  'DL': DL,
  'KA': KA,
};

/**
 * Calculate court fee for a given state and suit value.
 * 
 * @param {string} stateCode - State abbreviation (e.g., 'AP', 'DL')
 * @param {number} suitValue - The monetary value of the suit
 * @returns {Object} Calculation result with metadata
 * @throws {Error} With code 'INVALID_INPUT' for bad inputs
 */
function calculateCourtFee(stateCode, suitValue) {
  const calculator = calculators[stateCode];

  if (!calculator) {
    return {
      supported: false,
      message: `Court fee calculation is not yet available for state: ${stateCode}`,
    };
  }

  const { isValid, error } = calculator.validateInput(suitValue);
  if (!isValid) {
    const err = new Error(error);
    err.code = 'INVALID_INPUT';
    throw err;
  }

  const courtFee = calculator.calculateCourtFee(suitValue);
  const meta = calculator.META;

  return {
    supported: true,
    stateCode: meta.stateCode,
    stateName: meta.stateName,
    suitValue: Number(suitValue),
    courtFee,
    currency: 'INR',
    verified: meta.legislation.verified,
    act: meta.legislation.act,
    version: meta.version,
  };
}

/**
 * Get metadata for a specific state calculator.
 * 
 * @param {string} stateCode - State abbreviation
 * @returns {Object|null} META object or null if state is not supported
 */
function getStateMetadata(stateCode) {
  const calculator = calculators[stateCode];
  if (!calculator) return null;
  return calculator.META;
}

/**
 * Get a list of all supported state codes and names.
 * 
 * @returns {Array<{code: string, name: string, verified: boolean}>}
 */
function getSupportedStates() {
  const seen = new Set();
  const states = [];

  for (const [code, calculator] of Object.entries(calculators)) {
    // Avoid duplicating aliases (e.g., TS and TG both point to TG)
    const meta = calculator.META;
    const key = meta.stateCode;
    if (seen.has(key)) continue;
    seen.add(key);

    states.push({
      code: meta.stateCode,
      name: meta.stateName,
      verified: meta.legislation.verified,
    });
  }

  return states;
}

module.exports = {
  calculateCourtFee,
  getStateMetadata,
  getSupportedStates,
};
