const { calculateCourtFee, validateInput, META } = require('../states/JK');

describe('JK Court Fee Calculator - Functional Parity Tests', () => {
  describe('Metadata Verification', () => {
    it('should have the correct state metadata', () => {
      expect(META.stateCode).toBe('JK');
      expect(META.stateName).toBe('Jammu and Kashmir');
      expect(META.implementationType).toBe('Functional Compatibility');
    });
  });

  describe('Input Validation', () => {
    it('should reject invalid inputs', () => {
      expect(validateInput(undefined).isValid).toBe(false);
      expect(validateInput(null).isValid).toBe(false);
      expect(validateInput(0).isValid).toBe(false);
      expect(validateInput(-1000).isValid).toBe(false);
      expect(validateInput('abc').isValid).toBe(false);
    });

    it('should accept valid inputs', () => {
      expect(validateInput(100).isValid).toBe(true);
      expect(validateInput('1000').isValid).toBe(true);
    });
  });

  describe('Century Law Firm Verified Outputs', () => {
    const verifiedCases = [
      { value: 1000, expected: 100 },
      { value: 2000, expected: 162.50 },
      { value: 10000, expected: 750 },
      { value: 50000, expected: 4350 },
      { value: 100000, expected: 6600 },
      { value: 2000000, expected: 36600 },
      { value: 10000000, expected: 75000 }
    ];

    verifiedCases.forEach(({ value, expected }) => {
      it(`should return exactly ${expected} for a suit value of ${value}`, () => {
        const result = calculateCourtFee(value);
        expect(result).toBe(expected);
      });
    });
  });

  describe('Algorithm Safety & Range Boundaries', () => {
    it('should not throw errors on extremely large values and cap at 75000', () => {
      expect(calculateCourtFee(50000000)).toBe(75000);
    });
  });
});
