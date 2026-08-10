const MH = require('../states/MH');
const { calculateCourtFee, validateInput, META } = MH;
const { validateMeta, validateInterface } = require('./_helpers');

describe('Maharashtra (MH) Court Fee Calculator', () => {
  validateInterface(MH);

  describe('META object', () => {
    it('should have a valid META object for Functional Compatibility', () => {
      expect(META.stateCode).toBe('MH');
      expect(META.implementationType).toBe('Functional Compatibility');
      expect(META.statutoryVerification).toBe(false);
    });
  });

  describe('Functional Compatibility Tests (Century Law Firm Reference)', () => {
    
    // Low Range
    test.each([
      [1, 200],
      [10, 200],
      [50, 200],
      [99, 200],
      [100, 200],
      [101, 200],
      [250, 200],
      [500, 200],
      [999, 200],
      [1000, 200],
      [1001, 212],
      [1050, 212],
      [1100, 212],
      [1101, 224]
    ])('should calculate correct fee for Low Range value ₹%i as ₹%i', (suitValue, expectedFee) => {
      expect(calculateCourtFee(suitValue)).toBe(expectedFee);
    });

    // Middle Range
    test.each([
      [5000, 680],
      [5001, 695],
      [5100, 695],
      [5101, 710],
      [10000, 1430],
      [10001, 1505],
      [10500, 1505],
      [10501, 1580],
      [15000, 2180],
      [20000, 2930],
      [20001, 3030],
      [25000, 3430],
      [30000, 3930],
      [30001, 4030],
      [40000, 4430],
      [50000, 4930],
      [50001, 5080],
      [55000, 5080],
      [55001, 5230],
      [100000, 6430],
      [100001, 6630],
      [110000, 6630],
      [110001, 6830]
    ])('should calculate correct fee for Middle Range value ₹%i as ₹%i', (suitValue, expectedFee) => {
      expect(calculateCourtFee(suitValue)).toBe(expectedFee);
    });

    // High Range
    test.each([
      [500000, 14430],
      [500001, 14630],
      [1000000, 24430],
      [1500000, 31230],
      [2000000, 37230],
      [2000001, 38430],
      [3000000, 49230],
      [5000000, 73230],
      [10000000, 133230],
      [20000000, 253230]
    ])('should calculate correct fee for High Range value ₹%i as ₹%i', (suitValue, expectedFee) => {
      expect(calculateCourtFee(suitValue)).toBe(expectedFee);
    });

    // Maximum Cap Tests
    test.each([
      [23800000, 298830],
      [23800001, 300000], // Hits the cap exactly on next step
      [23900000, 300000],
      [30000000, 300000]
    ])('should enforce maximum fee cap correctly for value ₹%i as ₹%i', (suitValue, expectedFee) => {
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
