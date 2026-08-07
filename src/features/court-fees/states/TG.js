const AP = require('./AP');

/**
 * Court Fee Calculator for Telangana (TG)
 * 
 * Telangana follows the identical Andhra Pradesh Court-fees and 
 * Suits Valuation Act, 1956, adopted at the time of state bifurcation.
 */

const META = {
  stateCode: 'TG',
  stateName: 'Telangana',
  version: 1,
  lastUpdated: '2026-08-06',
  legislation: {
    act: 'Andhra Pradesh Court-fees and Suits Valuation Act, 1956 (Adopted)',
    amendment: 'Adopted by Telangana at state bifurcation (2014)',
    effectiveDate: '2014-06-02',
    citation: 'AP Act VII of 1956, Schedule I (as applicable to Telangana)',
    verified: true,
  },
};

module.exports = {
  META,
  calculateCourtFee: AP.calculateCourtFee,
  validateInput: AP.validateInput,
};
