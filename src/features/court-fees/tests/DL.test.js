const DL = require('../states/DL');
const { validateMeta, validateInterface } = require('./_helpers');

const verifiedData = [
  { v: 100, f: 10.00 },
  { v: 200, f: 20.00 },
  { v: 300, f: 30.00 },
  { v: 400, f: 40.00 },
  { v: 499, f: 50.00 },
  { v: 500, f: 50.00 },
  { v: 501, f: 76.50 },
  { v: 550, f: 82.50 },
  { v: 599, f: 90.00 },
  { v: 600, f: 90.00 },
  { v: 601, f: 91.50 },
  { v: 700, f: 105.00 },
  { v: 750, f: 112.50 },
  { v: 999, f: 150.00 },
  { v: 1000, f: 150.00 },
  { v: 1001, f: 150.00 },
  { v: 1002, f: 162.20 },
  { v: 1005, f: 162.20 },
  { v: 1010, f: 162.20 },
  { v: 1025, f: 162.20 },
  { v: 1050, f: 162.20 },
  { v: 1099, f: 162.20 },
  { v: 1100, f: 162.20 },
  { v: 1500, f: 211.00 },
  { v: 2000, f: 272.00 },
  { v: 2500, f: 333.00 },
  { v: 3000, f: 394.00 },
  { v: 4000, f: 516.00 },
  { v: 4999, f: 638.00 },
  { v: 5000, f: 638.00 },
  { v: 5001, f: 662.40 },
  { v: 5250, f: 662.40 },
  { v: 5500, f: 686.80 },
  { v: 7500, f: 882.00 },
  { v: 9999, f: 1126.00 },
  { v: 10000, f: 1126.00 },
  { v: 10001, f: 1162.50 },
  { v: 10500, f: 1162.50 },
  { v: 11000, f: 1199.00 },
  { v: 49999, f: 2832.00 },
  { v: 50000, f: 2832.00 },
  { v: 50001, f: 2880.80 },
  { v: 52500, f: 2880.80 },
  { v: 55000, f: 2880.80 },
];

describe('DL Court Fee Calculator', () => {
  validateMeta(DL);
  validateInterface(DL);

  describe('DL-specific metadata', () => {
    test('should be marked as unverified', () => {
      expect(DL.META.legislation.verified).toBe(false);
    });
  });

  describe('Fee calculations (Century Law Firm parity)', () => {
    verifiedData.forEach(({ v, f }) => {
      it(`should calculate ₹${f.toFixed(2)} for suit value ₹${v}`, () => {
        expect(DL.calculateCourtFee(v)).toBe(f);
      });
    });
  });

  describe('Input validation', () => {
    test('Rejects missing suit value', () => {
      expect(DL.validateInput(undefined).isValid).toBe(false);
    });

    test('Rejects negative suit value', () => {
      expect(DL.validateInput(-100).isValid).toBe(false);
    });

    test('Rejects non-numeric suit value', () => {
      expect(DL.validateInput('abc').isValid).toBe(false);
    });

    test('Accepts valid suit value', () => {
      expect(DL.validateInput(1000).isValid).toBe(true);
    });
  });
});
