# Court Fee Calculator Engine

A production-grade, modular backend engine for calculating statutory court fees across Indian states and Union Territories.

## Supported States (4 of 19)

| State | Code | Verified | Tests |
|-------|------|----------|-------|
| Andhra Pradesh | AP | ✅ Statute | 28 |
| Telangana | TG / TS | ✅ Statute | 30 |
| Delhi | DL | ⚠️ Functional parity | 55 |
| Karnataka | KA | ✅ Statute | 67 |
| **Total** | | | **180** |

## Architecture

```
court-fees/
├── registry.js              # Explicit state calculator registry (single source of truth)
├── index.js                 # Re-exports registry (backward compatibility)
├── courtFee.service.js      # Business logic / service layer
├── courtFee.controller.js   # API controller
├── courtFee.routes.js       # Express routes
├── utils.js                 # Shared utilities (CEIL, etc.)
├── PROGRESS.md              # Implementation progress tracker
├── states/
│   ├── _template.js         # Starter template for new states
│   ├── AP.js                # Andhra Pradesh
│   ├── TG.js                # Telangana (delegates to AP)
│   ├── DL.js                # Delhi
│   └── KA.js                # Karnataka
└── tests/
    ├── _helpers.js           # Shared test utilities
    ├── AP.test.js            # 28 tests
    ├── TG.test.js            # 30 tests
    ├── DL.test.js            # 55 tests
    └── KA.test.js            # 67 tests
```

## Architecture Principles (Frozen)

1. **Explicit registry** — no auto-discovery. Every state is hand-registered in `registry.js`.
2. **Versioned META** — every state module exports a `META` object with governing Act details.
3. **Layered architecture** — Controller → Service → Registry → State Module.
4. **State isolation** — amendments to one state never affect another.
5. **Standard interface** — every state exports exactly `META`, `calculateCourtFee()`, `validateInput()`.

## State Calculator Interface

Every state module must export:

```javascript
module.exports = {
  META: {
    stateCode: 'XX',
    stateName: 'State Name',
    version: 1,
    lastUpdated: 'YYYY-MM-DD',
    legislation: {
      act: 'Full Act Name and Year',
      amendment: 'Amendment details or null',
      effectiveDate: 'YYYY-MM-DD or null',
      citation: 'Official reference (Schedule, Article)',
      verified: true | false,   // true = implemented from authoritative statute
    },
  },
  calculateCourtFee(suitValue),  // Returns number
  validateInput(suitValue),      // Returns { isValid: boolean, error: string|null }
};
```

## Adding a New State

1. Copy `states/_template.js` to `states/XX.js`
2. Research the governing Court Fees Act from authoritative sources (India Code, state official gazette, High Court website)
3. Fill in the `META` object with the full legislation details; set `verified: true` only if implemented from statutory text
4. Implement `calculateCourtFee()` directly from the statutory Schedule
5. Add one line to `registry.js`:
   ```javascript
   const XX = require('./states/XX');
   // then in the calculators map:
   'XX': XX,
   ```
6. Create `tests/XX.test.js` using shared `_helpers.js` utilities with boundary tests for every slab
7. Run `npx jest src/features/court-fees/tests/` — all tests must pass
8. Update `PROGRESS.md`

## API

**POST** `/api/v1/court-fees/calculate`

**Request:**
```json
{ "stateCode": "KA", "suitValue": 100000 }
```

**Response — supported state:**
```json
{
  "stateCode": "KA",
  "stateName": "Karnataka",
  "suitValue": 100000,
  "courtFee": 6625,
  "currency": "INR",
  "verified": true,
  "act": "Karnataka Court-Fees and Suits Valuation Act, 1958",
  "version": 1
}
```

**Response — unsupported state (HTTP 200):**
```json
{
  "supported": false,
  "message": "Court fee calculation is not yet available for state: TN"
}
```

**Response — validation error (HTTP 400):**
```json
{ "error": "suitValue must be a positive number greater than 0" }
```

## Versioning Policy

- `version` in `META` is incremented when the statutory schedule changes (e.g., a new amendment Act).
- Breaking changes to the module interface require updating this README and all state modules.
- `DL` stays at `verified: false` until it is replaced with an implementation derived from the authoritative Delhi Court Fees Act schedule.

## Testing

Run the full court-fees test suite:
```bash
npx jest src/features/court-fees/tests/
```

Run a single state:
```bash
npx jest src/features/court-fees/tests/KA.test.js --verbose
```

## Calculation Methodologies

Different states use different calculation approaches:

| State | Methodology |
|-------|------------|
| AP / TG | Step-function (`CEIL`-rounded) — fee on the next rounded-up unit |
| KA | Continuous marginal — base fee + % of amount exceeding slab boundary |
| DL | Step-function (`Math.ceil`-rounded) — reverse-engineered, unverified |
