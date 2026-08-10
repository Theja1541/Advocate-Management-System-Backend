const BR = require('../states/BR');
const { calculateCourtFee, validateInput, META } = BR;
const { validateInterface } = require('./_helpers');

describe('Bihar (BR) Court Fee Calculator', () => {
  validateInterface(BR);

  describe('META object', () => {
    it('should have a valid META object for Functional Compatibility', () => {
      expect(META.stateCode).toBe('BR');
      expect(META.implementationType).toBe('Functional Compatibility');
      expect(META.statutoryVerification).toBe(false);
    });
  });

  describe('Functional Compatibility Tests (Century Law Firm Reference)', () => {
    
    // Low Range
    test.each([
      [1, 1.00],
      [10, 2.00],
      [100, 20.00],
      [101, 22.00],
      [200, 40.00],
      [500, 100.00],
      [900, 180.00],
      [1000, 200.00],
      [1001, 216.00]
    ])('should calculate correct fee for Low Range value ₹%i as ₹%f', (suitValue, expectedFee) => {
      expect(calculateCourtFee(suitValue)).toBe(expectedFee);
    });

    // Middle Range
    test.each([
      [1500, 280.00],
      [2000, 360.00],
      [3000, 520.00],
      [4000, 680.00],
      [5000, 840.00],
      [5001, 872.00],
      [6000, 968.00],
      [7500, 1160.00],
      [9000, 1352.00],
      [10000, 1480.00],
      [10001, 1528.00],
      [11000, 1576.00],
      [20000, 2440.00],
      [30000, 3080.00],
      [40000, 3400.00],
      [50000, 3720.00],
      [50001, 3800.00]
    ])('should calculate correct fee for Middle Range value ₹%i as ₹%f', (suitValue, expectedFee) => {
      expect(calculateCourtFee(suitValue)).toBe(expectedFee);
    });

    // High Range
    test.each([
      [100000, 4520.00],
      [100001, 4600.00],
      [150000, 5320.00],
      [200000, 6120.00],
      [250000, 6920.00],
      [250001, 7000.00],
      [300000, 7720.00],
      [400000, 9320.00],
      [500000, 10920.00],
      [500001, 11000.00],
      [750000, 14920.00],
      [750001, 15000.00],
      [1000000, 18920.00],
      [1000001, 19000.00],
      [1100000, 20520.00],
      [1100001, 20600.00],
      [1500000, 26920.00],
      [2000000, 34920.00],
      [3000000, 50000.00],
      [4000000, 50000.00],
      [5000000, 50000.00],
      [10000000, 50000.00],
      [20000000, 50000.00],
      [30000000, 50000.00],
      [50000000, 50000.00]
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
