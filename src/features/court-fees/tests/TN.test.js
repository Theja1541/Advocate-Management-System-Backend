const TN = require('../states/TN');
const { calculateCourtFee, validateInput, META } = TN;
const { validateInterface } = require('./_helpers');

describe('Tamil Nadu (TN) Court Fee Calculator', () => {
  validateInterface(TN);

  describe('META object', () => {
    it('should have a valid META object for Functional Compatibility', () => {
      expect(META.stateCode).toBe('TN');
      expect(META.implementationType).toBe('Functional Compatibility');
      expect(META.statutoryVerification).toBe(false);
    });
  });

  describe('Functional Compatibility Tests (Century Law Firm Reference)', () => {
    
    // Minimum Fee and Boundaries
    test.each([
      [1, 0.40],
      [4, 0.40],
      [5, 0.40],
      [6, 0.80],
      [10, 0.80],
      [95, 7.60],
      [96, 8.00],
      [100, 8.00],
      [101, 8.75],
      [110, 8.75],
      [111, 9.50]
    ])('should calculate correct fee for value ₹%i as ₹%f', (suitValue, expectedFee) => {
      expect(calculateCourtFee(suitValue)).toBe(expectedFee);
    });

    // Higher Values
    test.each([
      [1000, 75.50],
      [1001, 76.25],
      [5000, 375.50],
      [5001, 376.25],
      [10000, 750.50],
      [10001, 751.25],
      [50000, 3750.50],
      [50001, 3751.25],
      [100000, 7500.50],
      [100001, 7501.25],
      [500000, 37500.50],
      [1000000, 75000.50],
      [10000000, 750000.50],
      [10000001, 750001.25],
      [100000000, 7500000.50]
    ])('should calculate correct fee for High Range value ₹%i as ₹%f', (suitValue, expectedFee) => {
      expect(calculateCourtFee(suitValue)).toBe(expectedFee);
    });

  });

  describe('Validation Tests', () => {
    it('should reject invalid inputs', () => {
      expect(() => calculateCourtFee(null)).toThrow('Invalid suit value');
      expect(() => calculateCourtFee(-10)).toThrow('Invalid suit value');
      expect(() => calculateCourtFee(0)).toThrow('Invalid suit value');
      expect(() => calculateCourtFee('abc')).toThrow('Invalid suit value');
    });
  });
});
