// hardware-catalog.js — Real hardware product data with dimensions from manufacturer specs.
// Pure data module: no Three.js dependency.
//
// Hinge system: 2 fold hinges × 3 butterfly joints = 6 configurations.
// See hinge-design.md for full mechanical design rationale.

// ── Shared geometry constants ──
const PIVOT_OFFSET = 4.0;         // mm above Z_SWITCH_PLATE_TOP — clearance for 180° fold
const BRACKET_ANGLE_DEG = 15;     // degrees above horizontal
const BRACKET_ARM_LEN = PIVOT_OFFSET / Math.sin(BRACKET_ANGLE_DEG * Math.PI / 180); // ≈15.5mm
const BRACKET_HORIZ = BRACKET_ARM_LEN * Math.cos(BRACKET_ANGLE_DEG * Math.PI / 180); // ≈15.0mm
const BRACKET_WIDTH = 12;         // mm along Y (front-to-back extent at board edge)
const BRACKET_THICK = 2;          // mm stainless sheet
const BUTTERFLY_BORE = 9;         // mm inner bore of butterfly discs (clears 8mm shaft + gap)
const CLAMP_BOLT_DIA = 4;        // mm M4 clamping bolt through center

export const PIVOT_GEOMETRY = {
  pivotOffset: PIVOT_OFFSET,
  bracketAngleDeg: BRACKET_ANGLE_DEG,
  bracketArmLen: BRACKET_ARM_LEN,
  bracketHoriz: BRACKET_HORIZ,
  bracketWidth: BRACKET_WIDTH,
  bracketThick: BRACKET_THICK,
  butterflyBore: BUTTERFLY_BORE,
  clampBoltDia: CLAMP_BOLT_DIA,
};

export const HARDWARE_CATALOG = {
  // ═══════════════════════════════════════════════════════
  // FOLD HINGES — rotation around Y axis (belly→screen)
  // ═══════════════════════════════════════════════════════
  foldHinges: {
    'pha-8mm': {
      name: 'Reell PHA 8mm Friction Hinge',
      foldType: 'pha',
      dims: {
        shaftDia: 8,             // mm shaft outer diameter
        shaftLen: 30,            // mm total shaft length along Y
        bodyLen: 22,             // mm PHA body length along Y
        bodyWidth: 12,           // mm PHA body width (X)
        bodyHeight: 10,          // mm PHA body height (Z)
        bodyCornerR: 1.5,        // mm corner radius on body
        flagLeafLen: 15,         // mm flag leaf extension from body
        flagLeafWidth: 12,       // mm flag leaf width along Y
        flagLeafThick: 1.5,      // mm flag leaf thickness
        screwHoleDia: 2.5,       // mm M2.5 mounting holes in flag leaf
        screwHoleSpacing: 8,     // mm between screw holes (along Y)
        torqueNm: 0.46,          // N·m friction torque (middle option)
        rotationDeg: 360,        // degrees continuous rotation
      },
      weight: 8,                 // grams (Reell datasheet)
      bom: [
        { item: 'Reell PHA 8mm Friction Positioning Hinge', qty: 1, spec: '0.46 N·m, 360°, zinc finish' },
      ],
    },

    'bearing-pivot': {
      name: 'Miniature Sealed-Bearing Pivot',
      foldType: 'bearing',
      dims: {
        pinDia: 4,               // mm pivot pin diameter (Ti-6Al-4V or 316L SS)
        pinLen: 18,              // mm pin length along Y
        bearingOD: 8,            // mm MR84ZZ outer diameter
        bearingID: 4,            // mm MR84ZZ inner diameter
        bearingWidth: 3,         // mm MR84ZZ width
        bearingCount: 2,         // number of bearings
        yokeWidth: 12,           // mm yoke width along Y (between bearing seats)
        yokeHeight: 20,          // mm yoke height (Z extent of U-bracket)
        yokeThick: 2,            // mm yoke sheet thickness
        yokeArmWidth: 5,         // mm width of each yoke arm
        yokeSlotDeg: 270,        // degrees of open arc (allows 270° rotation)
        eClipDia: 6,             // mm E-clip outer diameter
        eClipThick: 0.6,         // mm E-clip thickness
        rotationDeg: 270,        // degrees max rotation
      },
      weight: 7,                 // grams (pin + bearings + yoke + E-clips)
      bom: [
        { item: 'Ti-6Al-4V Pivot Pin 4×18mm', qty: 1, spec: 'Ground, h6 tolerance' },
        { item: 'MR84ZZ Micro Ball Bearing 4×8×3mm', qty: 2, spec: 'Sealed, chrome steel' },
        { item: 'Stainless Yoke Bracket (custom)', qty: 1, spec: '316L SS, 2mm sheet' },
        { item: 'E-clip 4mm (DIN 6799)', qty: 2, spec: 'Spring steel' },
      ],
    },
  },

  // ═══════════════════════════════════════════════════════
  // BUTTERFLY JOINTS — rotation around Z axis (vertical)
  // ═══════════════════════════════════════════════════════
  butterflyJoints: {
    'hirth-24t': {
      name: 'Hirth Coupling (24T, 15°)',
      jointType: 'hirth',
      dims: {
        outerDia: 20,            // mm disc outer diameter
        innerBore: BUTTERFLY_BORE, // mm central bore (clears fold shaft)
        toothCount: 24,          // number of teeth
        toothAngleDeg: 60,       // degrees — included angle of V-groove
        // Computed: angular resolution = 360/24 = 15°
        // Flank angle β = arcsin(tan(π/48) / tan(30°)) ≈ 13.17°
        // Tooth height at OD: 2 × (20/2) × tan(13.17°) ≈ 4.68mm peak-to-valley → 2.3mm per tooth
        toothHeightOD: 2.3,      // mm tooth height at outer diameter (one side)
        toothHeightID: 0.7,      // mm tooth height at inner bore (one side)
        toothBaseThick: 2,       // mm solid base below teeth
        discThick: 5,            // mm total (3mm teeth zone + 2mm base)
        earLen: 5,               // mm mounting ear extension beyond OD
        earWidth: 6,             // mm mounting ear width along Y
        earThick: 2,             // mm mounting ear thickness
        earHoleDia: 2,           // mm M2 mounting screw holes in ears
      },
      clampType: 'thumbnut',     // M4 thumb nut + Belleville washer
      weight: 19,                // grams (2 discs + bolt + washer + nut)
      bom: [
        { item: 'Hirth Coupling Disc 20mm OD, 24T, 60° (custom)', qty: 2, spec: 'Hardened tool steel HRC 58, ground' },
        { item: 'M4×20 Socket Head Cap Screw', qty: 1, spec: 'Clamping bolt, 12.9 grade' },
        { item: 'Belleville Washer M4 (DIN 2093)', qty: 1, spec: 'Spring steel, Series A' },
        { item: 'M4 Knurled Thumb Nut (brass)', qty: 1, spec: '14mm OD, 8mm height' },
      ],
    },

    'curvic-36t': {
      name: 'Curvic Coupling (36T, 10°)',
      jointType: 'curvic',
      dims: {
        outerDia: 22,            // mm disc outer diameter
        innerBore: BUTTERFLY_BORE,
        toothCount: 36,
        // Curvic: arc-ground teeth. Tooth pitch = π×22/36 ≈ 1.92mm
        // Concave teeth on one disc, convex on the other
        toothArcRadius: 12,      // mm grinding wheel radius (defines tooth curvature)
        toothHeightOD: 1.8,      // mm tooth height at OD
        toothHeightID: 0.5,      // mm tooth height at bore
        toothBaseThick: 1.5,     // mm solid base below teeth
        discThick: 4.5,          // mm total (3mm teeth + 1.5mm base)
        earLen: 4,               // mm mounting ear extension
        earWidth: 6,
        earThick: 2,
        earHoleDia: 2,
      },
      clampType: 'thumbnut',
      weight: 17,                // grams
      bom: [
        { item: 'Curvic Coupling Disc 22mm OD, 36T (custom)', qty: 2, spec: '17-4PH SS, case-hardened, arc-ground' },
        { item: 'M4×20 Socket Head Cap Screw', qty: 1, spec: 'Clamping bolt' },
        { item: 'Belleville Washer M4 (DIN 2093)', qty: 1, spec: 'Spring steel' },
        { item: 'M4 Knurled Thumb Nut (brass)', qty: 1, spec: '14mm OD' },
      ],
    },

    'serrated-72t': {
      name: 'Serrated Flange (72T, 5°)',
      jointType: 'serrated',
      dims: {
        outerDia: 18,            // mm disc outer diameter
        innerBore: BUTTERFLY_BORE,
        toothCount: 72,
        // Fine radial serrations: pitch at OD = π×18/72 ≈ 0.79mm
        toothAngleDeg: 90,       // degrees — included angle (shallower than Hirth 60°)
        serrationDepth: 0.5,     // mm depth of serrations
        toothBaseThick: 2,       // mm solid base below serrations
        discThick: 2.5,          // mm total (0.5mm serrations + 2mm base)
        earLen: 4,
        earWidth: 5,
        earThick: 1.5,
        earHoleDia: 2,
        // Cam lever dims (replaces thumb nut for faster operation)
        camLeverLen: 18,         // mm lever arm length
        camLeverWidth: 5,        // mm lever width
        camLeverThick: 2,        // mm lever thickness
        camEccentricity: 1.5,    // mm cam throw (axial displacement per quarter-turn)
      },
      clampType: 'camlever',     // quarter-turn cam lever
      weight: 10,                // grams
      bom: [
        { item: 'Serrated Face Disc 18mm OD, 72T (custom)', qty: 2, spec: '7075-T6 aluminum, hard anodized' },
        { item: 'M4×18 Shoulder Bolt', qty: 1, spec: 'Cam lever pivot, 12.9 grade' },
        { item: 'Wave Spring Washer M4', qty: 1, spec: 'Spring steel, 0.5mm compressed' },
        { item: 'Cam Lever (custom)', qty: 1, spec: 'Aluminum, 18mm arm, eccentric cam' },
      ],
    },
  },

  // ═══════════════════════════════════════════════════════
  // ANGLED BRACKETS — connect board halves to pivot center
  // ═══════════════════════════════════════════════════════
  brackets: {
    'ss-bracket': {
      name: 'Stainless Steel Angled Bracket Pair',
      dims: {
        armLen: BRACKET_ARM_LEN,
        armWidth: BRACKET_WIDTH,
        armThick: BRACKET_THICK,
        angleDeg: BRACKET_ANGLE_DEG,
        horizontalReach: BRACKET_HORIZ,
        verticalRise: PIVOT_OFFSET,
        mountHoleDia: 2.5,       // mm M2.5 holes in board-side flange
        mountHoleCount: 2,       // per bracket
        mountHoleSpacing: 8,     // mm between mount holes
        flangeLen: 10,           // mm flange that sits flat on board edge
        flangeThick: BRACKET_THICK,
      },
      weight: 10,               // grams (pair)
      bom: [
        { item: 'Angled Mounting Bracket (custom)', qty: 2, spec: '316L SS, 2mm sheet, bent 15°' },
        { item: 'M2.5×8 Socket Head Cap Screw', qty: 4, spec: 'Bracket-to-frame fasteners' },
        { item: 'M2.5 Threaded Insert (brass)', qty: 4, spec: 'Press-fit into wood frame' },
      ],
    },
  },

  // ═══════════════════════════════════════════════════════
  // CABLES, TURNBUCKLES, EYE NUTS, CLEVIS PINS (unchanged)
  // ═══════════════════════════════════════════════════════
  turnbuckles: {
    'tekno-tkr6250-m3': {
      name: 'Tekno TKR6250 M3 Turnbuckle',
      dims: {
        eyeToEye: 55,
        bodyLen: 20,
        bodyDia: 5.5,
        rodDia: 3,
        eyeInner: 1.7,
        eyeOuter: 4,
        eyeThick: 1.5,
      },
      bom: [{ item: 'Tekno TKR6250 M3 Aluminum Turnbuckle 55mm', qty: 2, spec: '55mm eye-to-eye' }],
    },
  },

  eyeNuts: {
    'm3-304ss-eye-nut': {
      name: 'M3 304SS Lifting Eye Nut',
      dims: {
        ringInner: 7.25,
        ringOuter: 13,
        ringThick: 3,
        nutAF: 5.5,
        nutHeight: 2.4,
        totalH: 14,
        threadDia: 3,
        boltLen: 8,
      },
      bom: [{ item: 'M3 304SS Lifting Eye Nut', qty: 4, spec: 'DIN 582 style' }],
    },
  },

  clevisPins: {
    '5mm-ball-lock': {
      name: '5mm Quick-Release Ball Lock Pin',
      dims: {
        shaftDia: 5,
        bodyDia: 9,
        buttonDia: 6.5,
        gripLen: 15,
        handleLen: 12,
        ballDia: 2,
        ballCount: 3,
        totalLen: 40,
      },
      bom: [{ item: '5mm Quick-Release Ball Lock Pin', qty: 4, spec: 'Spring-loaded, 15mm grip' }],
    },
  },

  cables: {
    '1.5mm-wire-rope': {
      name: '1.5mm Stainless Wire Rope',
      dims: {
        diameter: 1.5,
      },
      bom: [{ item: '1.5mm 7x7 Stainless Steel Wire Rope', qty: 2, spec: '~150mm each, with crimped loops' }],
    },
  },
};

// ── Legacy compatibility: expose old 'hinges' key pointing to foldHinges ──
// Some code may reference HARDWARE_CATALOG.hinges — alias it.
HARDWARE_CATALOG.hinges = HARDWARE_CATALOG.foldHinges;

export const DEFAULT_SELECTION = {
  foldHinge: 'pha-8mm',
  butterflyJoint: 'hirth-24t',
  bracket: 'ss-bracket',
  turnbuckle: 'tekno-tkr6250-m3',
  eyeNut: 'm3-304ss-eye-nut',
  clevisPin: '5mm-ball-lock',
  cable: '1.5mm-wire-rope',
  // Legacy alias
  get hinge() { return this.foldHinge; },
  set hinge(v) { this.foldHinge = v; },
};

/**
 * Collect BOM entries for a given hardware selection.
 * @param {object} selection — keys matching DEFAULT_SELECTION
 * @returns {Array<{item, qty, spec}>}
 */
export function collectHardwareBom(selection = DEFAULT_SELECTION) {
  const bom = [];
  const cats = [
    ['foldHinges', selection.foldHinge],
    ['butterflyJoints', selection.butterflyJoint],
    ['brackets', selection.bracket],
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

/**
 * Get combined weight for a configuration.
 * @param {object} selection
 * @returns {number} grams
 */
export function getConfigWeight(selection = DEFAULT_SELECTION) {
  let w = 0;
  const fold = HARDWARE_CATALOG.foldHinges[selection.foldHinge];
  const bfly = HARDWARE_CATALOG.butterflyJoints[selection.butterflyJoint];
  const brkt = HARDWARE_CATALOG.brackets[selection.bracket];
  if (fold) w += fold.weight;
  if (bfly) w += bfly.weight;
  if (brkt) w += brkt.weight;
  return w;
}
