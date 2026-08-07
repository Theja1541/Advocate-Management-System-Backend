/**
 * Court Fee Calculator — Main Entry Point
 * 
 * Re-exports the registry API for backward compatibility.
 * All new code should import from './registry' directly.
 */

const registry = require('./registry');

module.exports = registry;
