// hardware-catalog.js — Real hardware product data with dimensions from manufacturer specs.
// Pure data module: no Three.js dependency.

export const HARDWARE_CATALOG = {
  hinges: {
    'barrel-8mm': {
      name: '8mm Concealed Barrel Hinge (SOSS)',
      dims: {
        barrelDia: 8,        // mm barrel outer diameter
        barrelLen: 11.5,     // mm each half-barrel length (mortise depth ~9.6mm + exposed)
        pinDia: 2,           // mm internal pivot pin diameter
        pinLen: 5,           // mm pin exposed gap between barrels
        totalLen: 23,        // mm assembled length (both barrels + gap)
        mortiseDepth: 9.6,   // mm drill depth into each board half
        hingeCount: 1,       // single barrel hinge at center
      },
      foldType: 'barrel',
      bom: [{ item: 'SOSS 8mm Concealed Brass Barrel Hinge', qty: 1, spec: '8mm dia, 180° opening' }],
    },
    'barrel-5mm': {
      name: '5mm Mini Barrel Hinge',
      dims: {
        barrelDia: 5,        // mm barrel outer diameter
        barrelLen: 8.5,      // mm each half-barrel length
        pinDia: 1.5,         // mm internal pivot pin diameter
        pinLen: 3,           // mm pin exposed gap between barrels
        totalLen: 17,        // mm assembled length
        mortiseDepth: 7,     // mm drill depth
        hingeCount: 1,       // single barrel hinge at center
      },
      foldType: 'barrel',
      bom: [{ item: '5mm Solid Brass Miniature Barrel Hinge', qty: 1, spec: '5mm dia, concealed' }],
    },
    'piano-12mm': {
      name: '12mm Stainless Piano Hinge',
      dims: {
        openWidth: 12,       // mm total when open flat
        leafWidth: 6,        // mm per leaf
        pinDia: 1.8,         // mm hinge pin diameter
        knuckleDia: 3,       // mm knuckle outer diameter
        thickness: 0.7,      // mm material/leaf thickness
        knuckleLen: 4,       // mm length of each knuckle segment
        knuckleGap: 1,       // mm gap between knuckles
      },
      foldType: 'piano',
      bom: [{ item: 'Piano Hinge 12mm Stainless Steel', qty: 1, spec: 'Cut to board length' }],
    },
    'ball-joint': {
      name: 'Ball Joint Hinge (legacy)',
      dims: {
        barrelR: 4,
        ballR: 3.5,
        rodR: 2.5,
        flangeW: 6,
        flangeH: 12,
      },
      foldType: 'ball',
      bom: [{ item: 'Custom ball-joint hinge assembly', qty: 1, spec: 'Custom' }],
    },
  },

  turnbuckles: {
    'tekno-tkr6250-m3': {
      name: 'Tekno TKR6250 M3 Turnbuckle',
      dims: {
        eyeToEye: 55,       // mm total length eye-center to eye-center
        bodyLen: 20,         // mm hex body length
        bodyDia: 5.5,        // mm hex body across-flats
        rodDia: 3,           // mm threaded rod diameter
        eyeInner: 1.7,       // mm eye hole inner diameter
        eyeOuter: 4,         // mm eye ring outer diameter
        eyeThick: 1.5,       // mm eye ring thickness
      },
      bom: [{ item: 'Tekno TKR6250 M3 Aluminum Turnbuckle 55mm', qty: 2, spec: '55mm eye-to-eye' }],
    },
  },

  eyeNuts: {
    'm3-304ss-eye-nut': {
      name: 'M3 304SS Lifting Eye Nut',
      dims: {
        ringInner: 7.25,     // mm ring hole inner diameter
        ringOuter: 13,       // mm ring outer diameter
        ringThick: 3,        // mm ring thickness (depth along bolt axis)
        nutAF: 5.5,          // mm hex nut across-flats
        nutHeight: 2.4,      // mm hex nut height
        totalH: 14,          // mm total height from nut bottom to ring top
        threadDia: 3,        // mm bolt thread diameter
        boltLen: 8,          // mm bolt shaft length sunk into plate
      },
      bom: [{ item: 'M3 304SS Lifting Eye Nut', qty: 4, spec: 'DIN 582 style' }],
    },
  },

  clevisPins: {
    '5mm-ball-lock': {
      name: '5mm Quick-Release Ball Lock Pin',
      dims: {
        shaftDia: 5,         // mm shaft diameter
        bodyDia: 9,          // mm T-handle body diameter
        buttonDia: 6.5,      // mm push-button diameter
        gripLen: 15,         // mm usable grip/insertion length
        handleLen: 12,       // mm handle/body length above shaft
        ballDia: 2,          // mm locking ball diameter
        ballCount: 3,        // number of locking balls
        totalLen: 40,        // mm total length
      },
      bom: [{ item: '5mm Quick-Release Ball Lock Pin', qty: 4, spec: 'Spring-loaded, 15mm grip' }],
    },
  },

  cables: {
    '1.5mm-wire-rope': {
      name: '1.5mm Stainless Wire Rope',
      dims: {
        diameter: 1.5,       // mm wire rope outer diameter
        // Note: thimbles are part of eye nut attachment, not modeled separately
      },
      bom: [{ item: '1.5mm 7x7 Stainless Steel Wire Rope', qty: 2, spec: '~150mm each, with crimped loops' }],
    },
  },
};

export const DEFAULT_SELECTION = {
  hinge: 'barrel-8mm',
  turnbuckle: 'tekno-tkr6250-m3',
  eyeNut: 'm3-304ss-eye-nut',
  clevisPin: '5mm-ball-lock',
  cable: '1.5mm-wire-rope',
};

/**
 * Collect BOM entries for a given hardware selection.
 * @param {object} selection — keys matching DEFAULT_SELECTION
 * @returns {Array<{item, qty, spec}>}
 */
export function collectHardwareBom(selection = DEFAULT_SELECTION) {
  const bom = [];
  const cats = [
    ['hinges', selection.hinge],
    ['turnbuckles', selection.turnbuckle],
    ['eyeNuts', selection.eyeNut],
    ['clevisPins', selection.clevisPin],
    ['cables', selection.cable],
  ];
  for (const [cat, id] of cats) {
    const entry = HARDWARE_CATALOG[cat]?.[id];
    if (entry?.bom) bom.push(...entry.bom);
  }
  return bom;
}
