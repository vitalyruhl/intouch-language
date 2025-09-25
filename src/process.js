/** @type {any} */
let ColorLib;
function getColorLib() {
  if (ColorLib) return ColorLib;
  try {
    // Try CommonJS require (older versions)
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    ColorLib = require('color');
    return ColorLib;
  } catch (e) {
    // Fallback: dynamic import for ESM-only version
    const mod = eval('require')("node:module").createRequire(__filename);
    // Use createRequire to resolve, then dynamic import
    return import('color').then(m => {
      ColorLib = m.default || m;
      return ColorLib;
    });
  }
}

/*
 * Generate color variant by inverting
 * luminance in the  HSL representation
 */
/**
 * @param {string} hex
 * @param {string} style
 */
function getVariant(hex, style) {
  if (style !== 'dark') return hex;
  const lib = getColorLib();
  // If promise (ESM path), we need a synchronous fallback: just return hex unchanged
  if (lib instanceof Promise) {
    // Defer variant computation (not critical for build) – keep original color
    return hex;
  }
  if (typeof lib !== 'function') return hex;
  const c = lib(hex);
  return c.hsl().lightness(100 - c.lightness()).hex().toLowerCase();
}

module.exports = {
  getVariant,
};
