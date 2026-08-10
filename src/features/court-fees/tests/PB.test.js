const PB = require('../states/PB');
const { calculateCourtFee, validateInput, META } = PB;
const { validateInterface } = require('./_helpers');

describe('Punjab (PB) Court Fee Calculator', () => {
  validateInterface(PB);

  describe('META object', () => {
    it('should have a valid META object for Functional Compatibility', () => {
      expect(META.stateCode).toBe('PB');
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
      [1001, 25.03]
    ])('should calculate correct fee for Low Range value ₹%i as ₹%f', (suitValue, expectedFee) => {
      expect(calculateCourtFee(suitValue)).toBe(expectedFee);
    });

    // Middle Range
    test.each([
      [5000, 125.00],
      [5001, 125.03],
      [10000, 250.00],
      [10001, 250.04],
      [15000, 425.00],
      [20000, 600.00],
      [25000, 825.00],
      [30000, 1050.00],
      [40000, 1600.00],
      [50000, 2250.00],
      [50001, 2250.07],
      [60000, 3000.00],
      [75000, 3975.00],
      [75001, 3975.06],
      [80000, 4250.00],
      [90000, 4800.00],
      [100000, 5350.00]
    ])('should calculate correct fee for Middle Range value ₹%i as ₹%f', (suitValue, expectedFee) => {
      expect(calculateCourtFee(suitValue)).toBe(expectedFee);
    });

    // High Range
    test.each([
      [100001, 5350.04],
      [150000, 7100.00],
      [200000, 8850.00],
      [200001, 8850.02],
      [250000, 9975.00],
      [250001, 9975.02],
      [300000, 11100.00],
      [400000, 13350.00],
      [500000, 15600.00],
      [500001, 15600.02],
      [600000, 17850.00],
      [600001, 17850.02],
      [750000, 21225.00],
      [750001, 21225.02],
      [1000000, 26850.00],
      [1100000, 29100.00],
      [1100001, 29100.02],
      [1500000, 38100.00],
      [2000000, 49350.00],
      [2000001, 49350.02],
      [2500000, 60600.00],
      [3000000, 71850.00],
      [4000000, 94350.00],
      [5000000, 116850.00],
      [10000000, 229350.00],
      [10000001, 229350.02],
      [15000000, 341850.00],
      [20000000, 454350.00],
      [50000000, 1129350.00]
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
