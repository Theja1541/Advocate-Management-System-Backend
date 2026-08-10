const { calculateCourtFee, validateInput, META } = require('../states/CH');

describe('CH Court Fee Calculator - Functional Parity Tests', () => {
  describe('Metadata Verification', () => {
    it('should have the correct state metadata', () => {
      expect(META.stateCode).toBe('CH');
      expect(META.stateName).toBe('Chandigarh');
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
      { value: 1000, expected: 150 },
      { value: 10000, expected: 1126 },
      { value: 50000, expected: 2832 },
      { value: 100000, expected: 3320 },
    ];

    verifiedCases.forEach(({ value, expected }) => {
      it(`should return exactly ${expected} for a suit value of ${value}`, () => {
        const result = calculateCourtFee(value);
        expect(result).toBe(expected);
      });
    });
  });

  describe('Algorithm Safety & Range Boundaries', () => {
    it('should accurately calculate without maximum cap up to reasonable numbers', () => {
      expect(calculateCourtFee(200000)).toBe(4296);
    });
  });
});
