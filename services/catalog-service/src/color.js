// CIE Lab & Delta-E Color Distance Engine for Shade Matching (ARCH-1429)

function hexToRgb(hex) {
  const cleanHex = hex.replace('#', '');
  const bigint = parseInt(cleanHex, 16);
  const r = (bigint >> 16) & 255;
  const g = (bigint >> 8) & 255;
  const b = bigint & 255;
  return { r, g, b };
}

// Convert sRGB (0-255) to CIE XYZ (D65 standard illuminant)
function rgbToXyz(r, g, b) {
  // 1. Gamma linearization
  let rLin = r / 255;
  let gLin = g / 255;
  let bLin = b / 255;

  rLin = rLin > 0.04045 ? Math.pow((rLin + 0.055) / 1.055, 2.4) : rLin / 12.92;
  gLin = gLin > 0.04045 ? Math.pow((gLin + 0.055) / 1.055, 2.4) : gLin / 12.92;
  bLin = bLin > 0.04045 ? Math.pow((bLin + 0.055) / 1.055, 2.4) : bLin / 12.92;

  // 2. Matrix conversion to XYZ
  const X = (rLin * 0.4124564 + gLin * 0.3575761 + bLin * 0.1804375) * 100;
  const Y = (rLin * 0.2126729 + gLin * 0.7151522 + bLin * 0.0721750) * 100;
  const Z = (rLin * 0.0193339 + gLin * 0.1191920 + bLin * 0.9503041) * 100;

  return { X, Y, Z };
}

// Convert XYZ to CIE L*a*b* (CIE 1976)
function xyzToLab(X, Y, Z) {
  // D65 reference white point
  const Xn = 95.047;
  const Yn = 100.000;
  const Zn = 108.883;

  let x = X / Xn;
  let y = Y / Yn;
  let z = Z / Zn;

  const f = (t) => (t > 0.008856 ? Math.cbrt(t) : 7.787 * t + 16 / 116);

  const fx = f(x);
  const fy = f(y);
  const fz = f(z);

  const L = 116 * fy - 16;
  const a = 500 * (fx - fy);
  const b = 200 * (fy - fz);

  return { L, a, b };
}

function hexToLab(hex) {
  const { r, g, b } = hexToRgb(hex);
  const { X, Y, Z } = rgbToXyz(r, g, b);
  return xyzToLab(X, Y, Z);
}

// Delta-E (CIE76 Euclidean Lab distance)
function calculateDeltaE(hex1, hex2) {
  const lab1 = hexToLab(hex1);
  const lab2 = hexToLab(hex2);

  const dL = lab1.L - lab2.L;
  const da = lab1.a - lab2.a;
  const db = lab1.b - lab2.b;

  return Math.sqrt(dL * dL + da * da + db * db);
}

// Confidence score calculation from Delta-E
function calculateConfidence(deltaE) {
  // Delta-E < 1.0 is indistinguishable to the human eye (100%)
  // Delta-E = 2.0 is just noticeable (~95%)
  // Delta-E = 10 is very noticeable (~65%)
  const score = Math.max(0, 100 - deltaE * 3.2);
  return parseFloat(score.toFixed(1));
}

module.exports = {
  hexToRgb,
  hexToLab,
  calculateDeltaE,
  calculateConfidence
};
