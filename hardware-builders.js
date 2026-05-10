// hardware-builders.js — Three.js geometry builders for real hardware components.
// Each builder creates geometry from catalog dimensions (mm).

import * as THREE from 'three';

// ═══════════════════════════════════════════════════════════════
// PIANO HINGE
// ═══════════════════════════════════════════════════════════════

/**
 * Build a piano hinge along the Y axis at x=0, z=0.
 * Caller positions the returned group at (hingeX, 0, hingeZ).
 * @param {object} dims — from catalog: openWidth, leafWidth, pinDia, knuckleDia, thickness, knuckleLen, knuckleGap
 * @param {object} mats — { steel, chrome }
 * @param {number} boardSpan — total Y-extent of the board (mm)
 * @returns {{ group, leftLeaf, rightLeaf, pinRod }}
 */
export function buildPianoHinge(dims, mats, boardSpan) {
  const group = new THREE.Group();
  group.userData.hwType = 'hinge';

  const { leafWidth, pinDia, knuckleDia, thickness, knuckleLen, knuckleGap } = dims;
  const halfLeaf = leafWidth;
  const leafSpan = boardSpan + 4; // extend 2mm beyond board each side

  // Left leaf — extends in -X direction from hinge line
  const leftLeafGeo = new THREE.BoxGeometry(halfLeaf, leafSpan, thickness);
  const leftLeaf = new THREE.Mesh(leftLeafGeo, mats.steel.clone());
  leftLeaf.position.set(-halfLeaf / 2, 0, 0);
  leftLeaf.castShadow = true;
  leftLeaf.userData._hingeLeaf = 'left';
  group.add(leftLeaf);

  // Right leaf — extends in +X direction
  const rightLeafGeo = new THREE.BoxGeometry(halfLeaf, leafSpan, thickness);
  const rightLeaf = new THREE.Mesh(rightLeafGeo, mats.steel.clone());
  rightLeaf.position.set(halfLeaf / 2, 0, 0);
  rightLeaf.castShadow = true;
  rightLeaf.userData._hingeLeaf = 'right';
  group.add(rightLeaf);

  // Knuckles — alternating left/right cylinders along the pin
  const knuckleR = knuckleDia / 2;
  const pitch = knuckleLen + knuckleGap;
  const nKnuckles = Math.max(3, Math.floor(leafSpan / pitch));
  const totalKnuckleSpan = nKnuckles * pitch - knuckleGap;
  const startY = -totalKnuckleSpan / 2 + knuckleLen / 2;

  const knuckleGeo = new THREE.CylinderGeometry(knuckleR, knuckleR, knuckleLen, 12);
  // Knuckles are oriented along Y (default CylinderGeometry axis)

  for (let i = 0; i < nKnuckles; i++) {
    const ky = startY + i * pitch;
    const isLeft = i % 2 === 0;
    const knuckle = new THREE.Mesh(knuckleGeo, mats.steel.clone());
    knuckle.position.set(0, ky, 0);
    knuckle.castShadow = true;
    knuckle.userData._hingeLeaf = isLeft ? 'left' : 'right';
    group.add(knuckle);
  }

  // Pin rod — runs through all knuckles along Y axis
  const pinR = pinDia / 2;
  const pinGeo = new THREE.CylinderGeometry(pinR, pinR, totalKnuckleSpan + 4, 8);
  const pinRod = new THREE.Mesh(pinGeo, mats.chrome.clone());
  pinRod.position.set(0, 0, 0);
  pinRod.castShadow = true;
  pinRod.userData._hingePin = true;
  group.add(pinRod);

  return { group, leftLeaf, rightLeaf, pinRod };
}

// ═══════════════════════════════════════════════════════════════
// CONCEALED BARREL HINGE
// ═══════════════════════════════════════════════════════════════

/**
 * Build concealed barrel hinges (e.g. SOSS) spaced along the Y axis at x=0, z=0.
 * Each hinge = two brass barrels (drilled into each half) connected by a steel pin.
 * @param {object} dims — { barrelDia, barrelLen, pinDia, pinLen, totalLen, mortiseDepth, hingeCount }
 * @param {object} mats — { brass, steel, chrome }
 * @param {number} boardSpan — total Y-extent of the board (mm)
 * @returns {{ group }}
 */
export function buildBarrelHinge(dims, mats, boardSpan) {
  const group = new THREE.Group();
  group.userData.hwType = 'hinge';

  const { barrelDia, barrelLen, pinDia, pinLen, hingeCount } = dims;
  const barrelR = barrelDia / 2;
  const pinR = pinDia / 2;

  // Space hinges evenly along the board span
  const spacing = boardSpan / (hingeCount + 1);

  for (let i = 0; i < hingeCount; i++) {
    const hy = -boardSpan / 2 + spacing * (i + 1);

    // Left barrel (drilled into left half, extends in -X)
    const lBarrelGeo = new THREE.CylinderGeometry(barrelR, barrelR, barrelLen, 16);
    lBarrelGeo.rotateZ(Math.PI / 2); // orient along X axis
    const lBarrel = new THREE.Mesh(lBarrelGeo, mats.brass.clone());
    lBarrel.position.set(-barrelLen / 2 - pinLen / 2, hy, 0);
    lBarrel.castShadow = true;
    lBarrel.userData._hingeLeaf = 'left';
    group.add(lBarrel);

    // Right barrel (drilled into right half, extends in +X)
    const rBarrelGeo = new THREE.CylinderGeometry(barrelR, barrelR, barrelLen, 16);
    rBarrelGeo.rotateZ(Math.PI / 2);
    const rBarrel = new THREE.Mesh(rBarrelGeo, mats.brass.clone());
    rBarrel.position.set(barrelLen / 2 + pinLen / 2, hy, 0);
    rBarrel.castShadow = true;
    rBarrel.userData._hingeLeaf = 'right';
    group.add(rBarrel);

    // Connecting pin (exposed between barrels)
    const pinGeo = new THREE.CylinderGeometry(pinR, pinR, pinLen + barrelLen * 2, 8);
    pinGeo.rotateZ(Math.PI / 2);
    const pin = new THREE.Mesh(pinGeo, mats.steel.clone());
    pin.position.set(0, hy, 0);
    pin.castShadow = true;
    pin.userData._hingePin = true;
    group.add(pin);

    // Annular grooves (decorative rings on each barrel for glue grip)
    [-1, 1].forEach(dir => {
      const grooveR = barrelR + 0.2;
      const grooveGeo = new THREE.TorusGeometry(barrelR - 0.3, 0.3, 6, 16);
      grooveGeo.rotateZ(Math.PI / 2); // orient around X axis
      const groove = new THREE.Mesh(grooveGeo, mats.brass.clone());
      const bx = dir * (barrelLen / 2 + pinLen / 2);
      groove.position.set(bx, hy, 0);
      groove.userData._hingeLeaf = dir < 0 ? 'left' : 'right';
      group.add(groove);
    });
  }

  return { group };
}

// ═══════════════════════════════════════════════════════════════
// BALL JOINT HINGE (legacy)
// ═══════════════════════════════════════════════════════════════

/**
 * Build the original ball-and-socket hinge.
 * @param {object} dims — { barrelR, ballR, rodR, flangeW, flangeH }
 * @param {object} mats — { steel, chrome, copper, brass }
 * @param {number} boardSpan — board Y-extent
 * @param {number} halfBoardW — half board width (hingeX - bbox.min.x)
 * @returns {{ group }}
 */
export function buildBallJointHinge(dims, mats, boardSpan, halfBoardW) {
  const group = new THREE.Group();
  group.userData.hwType = 'hinge';

  const { barrelR, ballR, rodR, flangeW, flangeH } = dims;
  const rodLen = Math.max(15, halfBoardW * 0.35);
  const rodOffset = rodLen / 2 + 5;
  const flangeOffset = rodOffset + rodLen / 2 + 3;
  const barrelLen = Math.max(20, rodOffset * 0.6);

  // Central barrel
  const barrelGeo = new THREE.CylinderGeometry(barrelR, barrelR, barrelLen, 32);
  barrelGeo.rotateZ(Math.PI / 2);
  const barrel = new THREE.Mesh(barrelGeo, mats.chrome.clone());
  barrel.castShadow = true;
  group.add(barrel);

  // Ball
  const ball = new THREE.Mesh(new THREE.SphereGeometry(ballR, 32, 32), mats.copper.clone());
  group.add(ball);

  // Rods
  const rodGeo = new THREE.CylinderGeometry(rodR, rodR, rodLen, 12);
  rodGeo.rotateZ(Math.PI / 2);
  const rodL = new THREE.Mesh(rodGeo, mats.steel.clone());
  rodL.position.x = -rodOffset;
  rodL.castShadow = true;
  group.add(rodL);
  const rodRMesh = new THREE.Mesh(rodGeo.clone(), mats.steel.clone());
  rodRMesh.position.x = rodOffset;
  rodRMesh.castShadow = true;
  group.add(rodRMesh);

  // Flanges
  const flangeGeo = new THREE.BoxGeometry(flangeW, flangeH, 4.8);
  const flangeL = new THREE.Mesh(flangeGeo, mats.steel.clone());
  flangeL.position.x = -flangeOffset;
  flangeL.castShadow = true;
  group.add(flangeL);
  const flangeR = new THREE.Mesh(flangeGeo.clone(), mats.steel.clone());
  flangeR.position.x = flangeOffset;
  flangeR.castShadow = true;
  group.add(flangeR);

  // T-nut accent
  const tnutGeo = new THREE.CylinderGeometry(5, 5, 3, 6);
  const tnut = new THREE.Mesh(tnutGeo, mats.brass.clone());
  tnut.position.y = -8;
  tnut.rotation.x = Math.PI / 2;
  tnut.castShadow = true;
  group.add(tnut);

  return { group };
}

// ═══════════════════════════════════════════════════════════════
// TURNBUCKLE
// ═══════════════════════════════════════════════════════════════

/**
 * Build a turnbuckle oriented along the X axis, centered at origin.
 * @param {object} dims — { eyeToEye, bodyLen, bodyDia, rodDia, eyeInner, eyeOuter, eyeThick }
 * @param {object} mats — { chrome, steel }
 * @returns {{ group }}
 */
export function buildTurnbuckle(dims, mats) {
  const group = new THREE.Group();
  group.userData.hwType = 'turnbuckle';

  const { eyeToEye, bodyLen, bodyDia, rodDia, eyeInner, eyeOuter, eyeThick } = dims;
  const halfBody = bodyLen / 2;
  const rodLen = (eyeToEye - bodyLen) / 2 - eyeOuter / 2; // rod from body end to eye center

  // Hex body (6-sided cylinder along X)
  const bodyGeo = new THREE.CylinderGeometry(bodyDia / 2, bodyDia / 2, bodyLen, 6);
  bodyGeo.rotateZ(Math.PI / 2); // orient along X
  const body = new THREE.Mesh(bodyGeo, mats.chrome.clone());
  body.castShadow = true;
  group.add(body);

  // Threaded rods + eye loops on each end
  [-1, 1].forEach(dir => {
    // Rod
    const rGeo = new THREE.CylinderGeometry(rodDia / 2, rodDia / 2, rodLen, 8);
    rGeo.rotateZ(Math.PI / 2);
    const rod = new THREE.Mesh(rGeo, mats.steel.clone());
    rod.position.x = dir * (halfBody + rodLen / 2);
    rod.castShadow = true;
    group.add(rod);

    // Eye loop (torus)
    const eyeR = (eyeInner + eyeOuter / 2) / 2; // midpoint radius
    const eyeTube = (eyeOuter - eyeInner) / 2;   // tube cross-section
    const eyeGeo = new THREE.TorusGeometry(eyeR, Math.max(0.3, eyeTube), 8, 16);
    eyeGeo.rotateY(Math.PI / 2); // orient perpendicular to X axis
    const eye = new THREE.Mesh(eyeGeo, mats.steel.clone());
    eye.position.x = dir * (halfBody + rodLen + eyeR);
    eye.castShadow = true;
    group.add(eye);
  });

  return { group };
}

// ═══════════════════════════════════════════════════════════════
// EYE NUT
// ═══════════════════════════════════════════════════════════════

/**
 * Build an eye nut (ring + hex nut + bolt shaft), oriented vertically.
 * Ring plane is perpendicular to X (cable runs through along X).
 * Bolt goes up into the plate (+Z).
 * Origin at the ring center height, bolt extends upward.
 * @param {object} dims — { ringInner, ringOuter, ringThick, nutAF, nutHeight, totalH, threadDia, boltLen }
 * @param {object} mats — { brass, steel }
 * @returns {{ group }}
 */
export function buildEyeNut(dims, mats) {
  const group = new THREE.Group();
  group.userData.hwType = 'eyeNut';

  const { ringInner, ringOuter, ringThick, nutAF, nutHeight, threadDia, boltLen } = dims;

  // Ring (torus) — cable passes through this
  const ringR = (ringInner + ringOuter) / 4;     // mean radius
  const ringTubeR = (ringOuter - ringInner) / 4;  // tube radius
  const ringGeo = new THREE.TorusGeometry(ringR, ringTubeR, 12, 24);
  ringGeo.rotateY(Math.PI / 2); // ring plane perpendicular to X axis
  const ring = new THREE.Mesh(ringGeo, mats.brass.clone());
  ring.castShadow = true;
  group.add(ring);

  // Hex nut base — sits below the ring, above the plate
  const nutGeo = new THREE.CylinderGeometry(nutAF / 2, nutAF / 2, nutHeight, 6);
  nutGeo.rotateX(Math.PI / 2); // align cylinder axis to Z
  const nut = new THREE.Mesh(nutGeo, mats.brass.clone());
  // Position nut so its top is at ring bottom
  nut.position.z = -(ringR + ringTubeR) - nutHeight / 2 + ringTubeR;
  nut.castShadow = true;
  group.add(nut);

  // Bolt shaft — extends upward into the plate
  const boltGeo = new THREE.CylinderGeometry(threadDia / 2, threadDia / 2, boltLen, 8);
  boltGeo.rotateX(Math.PI / 2); // align cylinder axis to Z
  const bolt = new THREE.Mesh(boltGeo, mats.steel.clone());
  bolt.position.z = nut.position.z + boltLen / 2;
  bolt.castShadow = true;
  group.add(bolt);

  return { group };
}

// ═══════════════════════════════════════════════════════════════
// BALL LOCK PIN (Clevis Pin)
// ═══════════════════════════════════════════════════════════════

/**
 * Build a quick-release ball lock pin, oriented vertically (shaft along Z).
 * Shaft points downward (-Z), handle/button on top (+Z).
 * Origin at the base of the handle (where shaft meets body).
 * @param {object} dims — { shaftDia, bodyDia, buttonDia, gripLen, handleLen, ballDia, ballCount, totalLen }
 * @param {object} mats — { chrome, steel }
 * @returns {{ group }}
 */
export function buildClevisPin(dims, mats) {
  const group = new THREE.Group();
  group.userData.hwType = 'clevisPin';

  const { shaftDia, bodyDia, buttonDia, gripLen, handleLen, ballDia, ballCount } = dims;

  // T-handle body (cylinder on top)
  const bodyGeo = new THREE.CylinderGeometry(bodyDia / 2, bodyDia / 2, handleLen, 16);
  bodyGeo.rotateX(Math.PI / 2); // align to Z axis
  const body = new THREE.Mesh(bodyGeo, mats.chrome.clone());
  body.position.z = handleLen / 2;
  body.castShadow = true;
  group.add(body);

  // Push button on top
  const btnGeo = new THREE.CylinderGeometry(buttonDia / 2, buttonDia / 2, 2, 16);
  btnGeo.rotateX(Math.PI / 2); // align to Z axis
  const btn = new THREE.Mesh(btnGeo, mats.steel.clone());
  btn.position.z = handleLen + 1;
  btn.castShadow = true;
  group.add(btn);

  // Shaft going downward
  const shaftGeo = new THREE.CylinderGeometry(shaftDia / 2, shaftDia / 2, gripLen, 12);
  shaftGeo.rotateX(Math.PI / 2); // align to Z axis
  const shaft = new THREE.Mesh(shaftGeo, mats.chrome.clone());
  shaft.position.z = -gripLen / 2;
  shaft.castShadow = true;
  group.add(shaft);

  // Locking balls around the shaft near the tip
  const ballGeo = new THREE.SphereGeometry(ballDia / 2, 8, 8);
  for (let i = 0; i < ballCount; i++) {
    const angle = (i / ballCount) * Math.PI * 2;
    const ball = new THREE.Mesh(ballGeo, mats.steel.clone());
    const bx = Math.cos(angle) * (shaftDia / 2 + ballDia / 4);
    const by = Math.sin(angle) * (shaftDia / 2 + ballDia / 4);
    ball.position.set(bx, by, -gripLen + ballDia);
    ball.castShadow = true;
    group.add(ball);
  }

  // Chamfer at shaft tip
  const tipGeo = new THREE.ConeGeometry(shaftDia / 2, 2, 12);
  tipGeo.rotateX(Math.PI / 2); // align to Z axis (tip points +Z by default after rotation)
  const tip = new THREE.Mesh(tipGeo, mats.chrome.clone());
  tip.position.z = -gripLen - 1;
  tip.rotation.x = Math.PI; // point downward (-Z)
  tip.castShadow = true;
  group.add(tip);

  return { group };
}

// ═══════════════════════════════════════════════════════════════
// CABLE RUN
// ═══════════════════════════════════════════════════════════════

/**
 * Build a cable tube along a CatmullRom curve.
 * @param {THREE.Vector3[]} points — control points for the curve
 * @param {object} dims — { diameter }
 * @param {object} mats — { cable }
 * @returns {{ group, tube }}
 */
export function buildCableRun(points, dims, mats) {
  const group = new THREE.Group();
  group.userData.hwType = 'cable';

  const curve = new THREE.CatmullRomCurve3(points);
  const tubeGeo = new THREE.TubeGeometry(curve, 32, dims.diameter / 2, 8, false);
  const tube = new THREE.Mesh(tubeGeo, mats.cable.clone());
  tube.castShadow = true;
  group.add(tube);

  return { group, tube };
}

// ═══════════════════════════════════════════════════════════════
// MASTER ASSEMBLY BUILDER
// ═══════════════════════════════════════════════════════════════

/**
 * Build all hardware components and return the assembly.
 * @param {object} catalog — HARDWARE_CATALOG
 * @param {object} selection — product IDs per category
 * @param {object} mats — { steel, brass, chrome, copper, cable }
 * @param {object} geo — board geometry info:
 *   { hingeX, hingeCenterY, hingeZ, bbox, boardSpan,
 *     cableAttachPoints: { nearLeftX, nearRightX, farLeftX, farRightX, nearCableY, farCableY },
 *     cableZ, layers: { Z_BOTTOM, T_BOTTOM_PLATE, T_CORK_LOWER, T_FRAME } }
 * @returns {{ group, hingeResult, cablesGroup, cableSegments, applyFold }}
 */
export function buildHardwareAssembly(catalog, selection, mats, geo) {
  const group = new THREE.Group();
  const { hingeX, hingeCenterY, hingeZ, bbox, boardSpan,
          cableAttachPoints, cableZ, layers } = geo;

  // ── HINGE ──
  const hingeDef = catalog.hinges[selection.hinge];
  let hingeResult;

  if (hingeDef.foldType === 'barrel') {
    hingeResult = buildBarrelHinge(hingeDef.dims, mats, boardSpan);
    hingeResult.group.position.set(hingeX, hingeCenterY, hingeZ);
  } else if (hingeDef.foldType === 'piano') {
    hingeResult = buildPianoHinge(hingeDef.dims, mats, boardSpan);
    hingeResult.group.position.set(hingeX, hingeCenterY, hingeZ);
  } else {
    const halfBoardW = hingeX - bbox.min.x;
    hingeResult = buildBallJointHinge(hingeDef.dims, mats, boardSpan, halfBoardW);
    hingeResult.group.position.set(hingeX, hingeCenterY, hingeZ);
  }
  group.add(hingeResult.group);

  // ── CABLES ──
  const cablesGroup = new THREE.Group();
  const cableSegments = [];
  const { nearLeftX, nearRightX, farLeftX, farRightX, nearCableY, farCableY } = cableAttachPoints;

  const tbDef = catalog.turnbuckles[selection.turnbuckle];
  const eyeDef = catalog.eyeNuts[selection.eyeNut];
  const pinDef = catalog.clevisPins[selection.clevisPin];
  const cableDef = catalog.cables[selection.cable];

  const tbDims = tbDef.dims;
  const eyeDims = eyeDef.dims;
  const pinDims = pinDef.dims;
  const cableDims = cableDef.dims;

  // Cable layout: each cable is a single run from left eye nut to right bracket.
  // Anchored at left eye nut (on left half). Free end has a ball lock pin.
  // When connected, pin inserts into bracket on right half.
  // When disconnected, cable hangs with catenary (gravity sag).
  //
  // Components per cable:
  //   Left half (fixed): eye nut → short cable → turnbuckle → cable → free end (ball lock pin)
  //   Right half (fixed): bracket receptor only
  //
  // The cable is owned by the left half. The right bracket is owned by the right half.
  // Connection state determines whether the free end is at the bracket or dangling.

  const CABLE_SEGMENTS = 24; // subdivision for catenary curve

  const cableConfigs = [
    { cy: nearCableY, leftX: nearLeftX, rightX: nearRightX, label: 'near' },
    { cy: farCableY,  leftX: farLeftX,  rightX: farRightX,  label: 'far' },
  ];

  cableConfigs.forEach(({ cy, leftX, rightX, label }) => {
    // Bracket position on right half: mirror of left attachment point
    const bracketX = rightX;

    // Turnbuckle position: between eye nut and midpoint
    const midX = (leftX + bracketX) / 2;
    const tbX = (leftX + midX) / 2;
    const halfTbLen = tbDims.eyeToEye / 2;

    // Total cable length from eye nut to bracket (straight line + slack)
    const straightDist = bracketX - leftX;
    const cableLength = straightDist * 1.05; // 5% slack for catenary

    // ── LEFT GROUP (anchored hardware: eye nut + turnbuckle) ──
    const leftGroup = new THREE.Group();
    leftGroup.userData._cableSide = 'left';

    // Eye nut at left attachment
    const eyeNut = buildEyeNut(eyeDims, mats);
    eyeNut.group.position.set(leftX, cy, cableZ);
    leftGroup.add(eyeNut.group);

    // Turnbuckle
    const tb = buildTurnbuckle(tbDims, mats);
    tb.group.position.set(tbX, cy, cableZ);
    leftGroup.add(tb.group);

    // Ball lock pin at the cable free end (initially at bracket position = connected)
    const pin = buildClevisPin(pinDims, mats);
    pin.group.scale.set(0.6, 0.6, 0.6);
    pin.group.rotation.y = Math.PI / 2; // shaft along +X
    pin.group.position.set(bracketX, cy, cableZ);
    pin.group.userData._isCableEnd = true;
    pin.group.userData._cableLabel = label;
    leftGroup.add(pin.group);

    cablesGroup.add(leftGroup);

    // ── RIGHT GROUP (bracket receptor only) ──
    const rightGroup = new THREE.Group();
    rightGroup.userData._cableSide = 'right';

    const bracketGeo = new THREE.BoxGeometry(4, 6, layers.T_FRAME);
    const bracket = new THREE.Mesh(bracketGeo, mats.steel.clone());
    bracket.position.set(bracketX, cy, cableZ + layers.T_FRAME / 2);
    bracket.castShadow = true;
    bracket.userData._isBracket = true;
    bracket.userData._cableLabel = label;
    rightGroup.add(bracket);

    cablesGroup.add(rightGroup);

    // ── CABLE MESH (catenary tube updated dynamically) ──
    // Initial state: connected (straight line from eye nut to bracket)
    const cablePts = [];
    for (let i = 0; i <= CABLE_SEGMENTS; i++) {
      const t = i / CABLE_SEGMENTS;
      cablePts.push(new THREE.Vector3(
        leftX + t * (bracketX - leftX),
        cy,
        cableZ
      ));
    }
    const cableCurve = new THREE.CatmullRomCurve3(cablePts);
    const cableTubeGeo = new THREE.TubeGeometry(cableCurve, CABLE_SEGMENTS, cableDims.diameter / 2, 8, false);
    const cableTube = new THREE.Mesh(cableTubeGeo, mats.cable.clone());
    cableTube.castShadow = true;
    cableTube.userData._cableTube = true;
    cableTube.userData._cableLabel = label;
    cablesGroup.add(cableTube);

    cableSegments.push({
      leftGroup, rightGroup, cy, label,
      turnbuckleX: tbX,
      pinGroup: pin.group,
      bracketMesh: bracket,
      cableTube,
      anchorX: leftX,       // fixed anchor point X
      bracketX: bracketX,   // target bracket X on right half
      cableLength,
      connected: true,       // whether free end is connected to bracket
      freeEndPos: new THREE.Vector3(bracketX, cy, cableZ), // current free end world position
    });
  });

  group.add(cablesGroup);

  // ── FOLD ANIMATION ──
  function applyFold(internalDeg) {
    const halfRad = (internalDeg * Math.PI / 180) / 2;
    const yAxis = new THREE.Vector3(0, 1, 0);
    const pivot = new THREE.Vector3(hingeX, hingeCenterY, hingeZ);

    // --- Hinge articulation ---
    if (hingeDef.foldType === 'barrel' || hingeDef.foldType === 'piano') {
      // Barrel/piano hinge: left parts rotate with left half, right parts with right half
      // Pins stay at center
      hingeResult.group.children.forEach(child => {
        if (!child.userData._origPos) {
          child.userData._origPos = child.position.clone();
          child.userData._origQuat = child.quaternion.clone();
        }
        child.position.copy(child.userData._origPos);
        child.quaternion.copy(child.userData._origQuat);

        if (internalDeg !== 0) {
          const leaf = child.userData._hingeLeaf;
          if (leaf === 'left') {
            child.quaternion.premultiply(new THREE.Quaternion().setFromAxisAngle(yAxis, halfRad));
            const p = child.position.clone();
            p.applyAxisAngle(yAxis, halfRad);
            child.position.copy(p);
          } else if (leaf === 'right') {
            child.quaternion.premultiply(new THREE.Quaternion().setFromAxisAngle(yAxis, -halfRad));
            const p = child.position.clone();
            p.applyAxisAngle(yAxis, -halfRad);
            child.position.copy(p);
          }
          // Pin rod stays at center (no rotation needed)
        }
      });
    } else {
      // Ball joint: rotate flanges/rods away from center
      hingeResult.group.children.forEach(child => {
        if (!child.userData._origPos) {
          child.userData._origPos = child.position.clone();
          child.userData._origQuat = child.quaternion.clone();
        }
        child.position.copy(child.userData._origPos);
        child.quaternion.copy(child.userData._origQuat);

        if (internalDeg !== 0) {
          // Use position relative to hinge group origin (which is at hingeX, hingeCenterY, hingeZ)
          const origX = child.userData._origPos.x;
          if (origX < -2) {
            const p = child.position.clone();
            p.applyAxisAngle(yAxis, halfRad);
            child.position.copy(p);
            child.quaternion.premultiply(new THREE.Quaternion().setFromAxisAngle(yAxis, halfRad));
          } else if (origX > 2) {
            const p = child.position.clone();
            p.applyAxisAngle(yAxis, -halfRad);
            child.position.copy(p);
            child.quaternion.premultiply(new THREE.Quaternion().setFromAxisAngle(yAxis, -halfRad));
          }
        }
      });
    }

    // --- Cable segments follow their respective halves ---
    cablesGroup.visible = true;
    cableSegments.forEach(seg => {
      // Reset hardware groups to original positions
      [seg.leftGroup, seg.rightGroup].forEach(grp => {
        grp.children.forEach(child => {
          if (!child.userData._cableOrigPos) {
            child.userData._cableOrigPos = child.position.clone();
            child.userData._cableOrigQuat = child.quaternion.clone();
          }
          child.position.copy(child.userData._cableOrigPos);
          child.quaternion.copy(child.userData._cableOrigQuat);
        });
      });

      if (internalDeg !== 0) {
        // Left hardware (eye nut, turnbuckle) follows left half fold
        seg.leftGroup.children.forEach(child => {
          if (child.userData._isCableEnd) return; // pin is handled separately
          const p = child.position.clone().sub(pivot);
          p.applyAxisAngle(yAxis, halfRad);
          child.position.copy(p.add(pivot));
          child.quaternion.premultiply(new THREE.Quaternion().setFromAxisAngle(yAxis, halfRad));
        });
        // Right hardware (bracket) follows right half fold
        seg.rightGroup.children.forEach(child => {
          const p = child.position.clone().sub(pivot);
          p.applyAxisAngle(yAxis, -halfRad);
          child.position.copy(p.add(pivot));
          child.quaternion.premultiply(new THREE.Quaternion().setFromAxisAngle(yAxis, -halfRad));
        });
      }

      // Compute current world positions of anchor and bracket after fold
      const anchorOrig = new THREE.Vector3(seg.anchorX, seg.cy, cableZ);
      const bracketOrig = new THREE.Vector3(seg.bracketX, seg.cy, cableZ);
      let anchorWorld, bracketWorld;

      if (internalDeg !== 0) {
        const pa = anchorOrig.clone().sub(pivot);
        pa.applyAxisAngle(yAxis, halfRad);
        anchorWorld = pa.add(pivot);
        const pb = bracketOrig.clone().sub(pivot);
        pb.applyAxisAngle(yAxis, -halfRad);
        bracketWorld = pb.add(pivot);
      } else {
        anchorWorld = anchorOrig.clone();
        bracketWorld = bracketOrig.clone();
      }

      // Update cable tube geometry with catenary
      const dist = anchorWorld.distanceTo(bracketWorld);

      if (seg.connected && dist <= seg.cableLength) {
        // Connected: cable runs from anchor to bracket with slight sag
        const sag = Math.max(2, (seg.cableLength - dist) * 0.5);
        updateCableCatenary(seg.cableTube, anchorWorld, bracketWorld, sag, CABLE_SEGMENTS, cableDims);
        // Pin at bracket position
        seg.pinGroup.position.copy(bracketWorld);
        if (internalDeg !== 0) {
          seg.pinGroup.quaternion.copy(seg.pinGroup.userData._cableOrigQuat || new THREE.Quaternion());
          seg.pinGroup.quaternion.premultiply(new THREE.Quaternion().setFromAxisAngle(yAxis, -halfRad));
        }
      } else {
        // Disconnected: cable hangs from anchor under gravity
        seg.connected = false;
        const hangLen = Math.min(seg.cableLength * 0.6, 40); // how far the cable hangs down
        const freeEnd = anchorWorld.clone();
        freeEnd.z -= hangLen;
        freeEnd.x += 5; // slight X offset so it's visible
        seg.freeEndPos.copy(freeEnd);
        updateCableCatenary(seg.cableTube, anchorWorld, freeEnd, hangLen * 0.3, CABLE_SEGMENTS, cableDims);
        // Pin dangles at free end
        seg.pinGroup.position.copy(freeEnd);
        seg.pinGroup.quaternion.identity(); // hangs vertically
      }
    });
  }

  /**
   * Update a cable tube mesh with a catenary-shaped curve.
   * @param {THREE.Mesh} tubeMesh — the existing tube mesh to update
   * @param {THREE.Vector3} start — start point
   * @param {THREE.Vector3} end — end point
   * @param {number} sag — maximum sag below the straight line (mm)
   * @param {number} segments — number of curve subdivisions
   * @param {object} cableDims — { diameter }
   */
  function updateCableCatenary(tubeMesh, start, end, sag, segments, cblDims) {
    const pts = [];
    for (let i = 0; i <= segments; i++) {
      const t = i / segments;
      // Parabolic sag: maximum at t=0.5, zero at t=0 and t=1
      const sagAmount = -sag * 4 * t * (1 - t);
      pts.push(new THREE.Vector3(
        start.x + t * (end.x - start.x),
        start.y + t * (end.y - start.y),
        start.z + t * (end.z - start.z) + sagAmount
      ));
    }
    const curve = new THREE.CatmullRomCurve3(pts);
    const newGeo = new THREE.TubeGeometry(curve, segments, cblDims.diameter / 2, 8, false);
    tubeMesh.geometry.dispose();
    tubeMesh.geometry = newGeo;
  }

  /**
   * Try to connect a cable's free end to its bracket.
   * @param {number} cableIdx — index into cableSegments
   * @returns {boolean} — true if connected successfully
   */
  function connectCable(cableIdx) {
    const seg = cableSegments[cableIdx];
    if (!seg || seg.connected) return false;
    seg.connected = true;
    return true;
  }

  /**
   * Disconnect a cable from its bracket.
   * @param {number} cableIdx — index into cableSegments
   */
  function disconnectCable(cableIdx) {
    const seg = cableSegments[cableIdx];
    if (!seg || !seg.connected) return;
    seg.connected = false;
  }

  /**
   * Set the free end position of a disconnected cable (for mouse dragging).
   * @param {number} cableIdx
   * @param {THREE.Vector3} worldPos
   */
  function setCableFreeEnd(cableIdx, worldPos) {
    const seg = cableSegments[cableIdx];
    if (!seg || seg.connected) return;
    seg.freeEndPos.copy(worldPos);
  }

  return {
    group, hingeResult, cablesGroup, cableSegments, applyFold,
    connectCable, disconnectCable, setCableFreeEnd,
  };
}
