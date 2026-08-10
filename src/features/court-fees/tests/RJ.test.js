const RJ = require('../states/RJ');
const { calculateCourtFee, validateInput, META } = RJ;
const { validateInterface } = require('./_helpers');

describe('Rajasthan (RJ) Court Fee Calculator', () => {
  validateInterface(RJ);

  describe('META object', () => {
    it('should have a valid META object for Functional Compatibility', () => {
      expect(META.stateCode).toBe('RJ');
      expect(META.implementationType).toBe('Functional Compatibility');
      expect(META.statutoryVerification).toBe(false);
    });
  });

  describe('Functional Compatibility Tests (Century Law Firm Reference)', () => {
    
    // Low Range
    test.each([
      [1, 0.03],
      [10, 0.25],
      [100, 2.50],
      [101, 2.53],
      [1000, 25.00],
      [1001, 25.03],
      [5000, 125.00],
      [5001, 125.03],
      [10000, 250.00],
      [10001, 250.03],
      [15000, 375.00],
      [15001, 375.08]
    ])('should calculate correct fee for Low Range value ₹%i as ₹%f', (suitValue, expectedFee) => {
      expect(calculateCourtFee(suitValue)).toBe(expectedFee);
    });

    // Middle Range
    test.each([
      [20000, 750.00],
      [25000, 1125.00],
      [30000, 1500.00],
      [50000, 3000.00],
      [50001, 3000.08],
      [60000, 3750.00],
      [75000, 4875.00],
      [75001, 4875.07],
      [80000, 5225.00],
      [90000, 5925.00],
      [100000, 6625.00],
      [100001, 6625.07],
      [250000, 17125.00],
      [250001, 17125.06],
      [300000, 20375.00],
      [500000, 33375.00],
      [500001, 33375.06],
      [750000, 48375.00],
      [750001, 48375.06]
    ])('should calculate correct fee for Middle Range value ₹%i as ₹%f', (suitValue, expectedFee) => {
      expect(calculateCourtFee(suitValue)).toBe(expectedFee);
    });

    // High Range
    test.each([
      [1000000, 62125.00],
      [1500000, 87125.00],
      [2000000, 109625.00],
      [2000001, 109625.04],
      [2500000, 129625.00],
      [3000000, 147125.00],
      [4000000, 177125.00],
      [5000000, 202125.00],
      [10000000, 327125.00]
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
