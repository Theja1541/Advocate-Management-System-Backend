const UP = require('../states/UP');
const { calculateCourtFee, validateInput, META } = UP;
const { validateInterface } = require('./_helpers');

describe('Uttar Pradesh (UP) Court Fee Calculator', () => {
  validateInterface(UP);

  describe('META object', () => {
    it('should have a valid META object for Functional Compatibility', () => {
      expect(META.stateCode).toBe('UP');
      expect(META.implementationType).toBe('Functional Compatibility');
      expect(META.statutoryVerification).toBe(false);
    });
  });

  describe('Functional Compatibility Tests (Century Law Firm Reference)', () => {
    
    // Low Range
    test.each([
      [1, 0.50],
      [5, 0.50],
      [6, 1.00],
      [10, 1.00],
      [50, 5.00],
      [51, 5.50],
      [100, 10.00],
      [101, 11.25],
      [110, 11.25],
      [200, 22.50],
      [300, 35.00],
      [400, 50.00],
      [500, 65.00], // Follows mathematical logic, overriding conflicting typo 67.25
      [510, 67.25], // Typo correction mapped properly
      [900, 155.00],
      [1000, 177.50],
      [1001, 189.50],
      [1050, 189.50],
      [1100, 189.50],
      [1101, 201.50]
    ])('should calculate correct fee for Low Range value ₹%i as ₹%f', (suitValue, expectedFee) => {
      expect(calculateCourtFee(suitValue)).toBe(expectedFee);
    });

    // Middle Range
    test.each([
      [5000, 657.50],
      [5001, 677.50],
      [5100, 677.50],
      [5101, 677.50],
      [5200, 677.50],
      [5201, 697.50],
      [5500, 717.50],
      [10000, 1157.50],
      [10001, 1195.50],
      [10500, 1195.50],
      [10501, 1232.50],
      [11000, 1232.50],
      [50000, 4157.50],
      [50001, 4195.00],
      [51000, 4232.50],
      [51001, 4270.00],
      [55000, 4532.50]
    ])('should calculate correct fee for Middle Range value ₹%i as ₹%f', (suitValue, expectedFee) => {
      expect(calculateCourtFee(suitValue)).toBe(expectedFee);
    });

    // High Range
    test.each([
      [100000, 7907.50],
      [100001, 7945.00],
      [250000, 19157.50],
      [250001, 19195.00],
      [500000, 37907.50],
      [750000, 56657.50],
      [750001, 56695.00],
      [1000000, 75407.50],
      [10000000, 750407.50]
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
