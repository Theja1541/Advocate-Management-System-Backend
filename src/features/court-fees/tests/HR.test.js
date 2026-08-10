const HR = require('../states/HR');
const { calculateCourtFee, validateInput, META } = HR;
const { validateInterface } = require('./_helpers');

describe('Haryana (HR) Court Fee Calculator', () => {
  validateInterface(HR);

  describe('META object', () => {
    it('should have a valid META object for Functional Compatibility', () => {
      expect(META.stateCode).toBe('HR');
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
      [15000, 375.00]
    ])('should calculate correct fee for Low Range value ₹%i as ₹%f', (suitValue, expectedFee) => {
      expect(calculateCourtFee(suitValue)).toBe(expectedFee);
    });

    // Middle Range
    test.each([
      [20000, 550.00],
      [25000, 725.00],
      [30000, 930.00],
      [40000, 1390.00],
      [50000, 1940.00],
      [50001, 1940.06],
      [60000, 2580.00],
      [75000, 3675.00],
      [75001, 3675.07],
      [80000, 4000.00],
      [90000, 4650.00],
      [100000, 5300.00],
      [100001, 5300.07]
    ])('should calculate correct fee for Middle Range value ₹%i as ₹%f', (suitValue, expectedFee) => {
      expect(calculateCourtFee(suitValue)).toBe(expectedFee);
    });

    // High Range
    test.each([
      [150000, 8550.00],
      [200000, 11800.00],
      [200001, 11800.07],
      [250000, 15050.00],
      [250001, 15050.07],
      [300000, 18300.00],
      [400000, 24800.00],
      [500000, 31300.00],
      [500001, 31300.06],
      [600000, 36800.00],
      [600001, 36800.06],
      [750000, 45050.00],
      [750001, 45050.06],
      [1000000, 58800.00],
      [1100000, 63300.00],
      [1100001, 63300.05],
      [1500000, 81300.00],
      [2000000, 103800.00],
      [2000001, 103800.04],
      [2500000, 121300.00],
      [3000000, 138800.00],
      [4000000, 163800.00],
      [5000000, 183800.00],
      [10000000, 218800.00],
      [20000000, 268800.00],
      [50000000, 418800.00]
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
