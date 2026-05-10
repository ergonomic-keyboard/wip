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

  if (hingeDef.foldType === 'piano') {
    hingeResult = buildPianoHinge(hingeDef.dims, mats, boardSpan);
    hingeResult.group.position.set(hingeX, hingeCenterY, hingeZ);
    // Rotate the whole hinge so leaves lie flat (Z-plane) when fold=0
    // Piano hinge leaves should be in XY plane at hingeZ
    // The knuckles and pin run along Y, which is already correct
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

  // Cable layout per cable:
  // Left half:  eyeNut (at board edge) → cable → turnbuckle (midway) → cable → clevis bracket (near hinge on left side)
  // Right half: clevis bracket (near hinge on right side) → cable → eyeNut (at board edge)
  // The clevis pins are where the two halves disengage during fold.
  // Position clevis pins at ~15mm from hinge line (enough room for the pin mechanism)
  const clevisOffset = pinDims.shaftDia / 2 + 8; // shaft radius + some bracket clearance

  const cableConfigs = [
    { cy: nearCableY, leftX: nearLeftX, rightX: nearRightX, label: 'near' },
    { cy: farCableY,  leftX: farLeftX,  rightX: farRightX,  label: 'far' },
  ];

  cableConfigs.forEach(({ cy, leftX, rightX, label }) => {
    const clevisLeftX = hingeX - clevisOffset;
    const clevisRightX = hingeX + clevisOffset;

    // Turnbuckle position: midway between eye nut and clevis on left side
    const tbX = (leftX + clevisLeftX) / 2;
    const halfTbLen = tbDims.eyeToEye / 2;

    // ── LEFT SEGMENT ── (stays with left half during fold)
    const leftSegGroup = new THREE.Group();
    leftSegGroup.userData._cableSide = 'left';

    // Eye nut at left attachment point
    const eyeNutL = buildEyeNut(eyeDims, mats);
    eyeNutL.group.position.set(leftX, cy, cableZ);
    leftSegGroup.add(eyeNutL.group);

    // Cable from eye nut to turnbuckle left eye
    const cableL1 = buildCableRun([
      new THREE.Vector3(leftX + eyeDims.ringOuter / 2, cy, cableZ),
      new THREE.Vector3(tbX - halfTbLen, cy, cableZ),
    ], cableDims, mats);
    leftSegGroup.add(cableL1.group);

    // Turnbuckle
    const tb = buildTurnbuckle(tbDims, mats);
    tb.group.position.set(tbX, cy, cableZ);
    leftSegGroup.add(tb.group);

    // Cable from turnbuckle right eye to clevis
    const cableL2 = buildCableRun([
      new THREE.Vector3(tbX + halfTbLen, cy, cableZ),
      new THREE.Vector3(clevisLeftX, cy, cableZ),
    ], cableDims, mats);
    leftSegGroup.add(cableL2.group);

    // Clevis bracket on left side (small plate the pin goes through)
    const bracketGeo = new THREE.BoxGeometry(4, 6, layers.T_FRAME);
    const bracketL = new THREE.Mesh(bracketGeo, mats.steel.clone());
    bracketL.position.set(clevisLeftX, cy, cableZ + layers.T_FRAME / 2);
    bracketL.castShadow = true;
    leftSegGroup.add(bracketL);

    cablesGroup.add(leftSegGroup);

    // ── RIGHT SEGMENT ── (stays with right half during fold)
    const rightSegGroup = new THREE.Group();
    rightSegGroup.userData._cableSide = 'right';

    // Clevis bracket on right side
    const bracketR = new THREE.Mesh(bracketGeo.clone(), mats.steel.clone());
    bracketR.position.set(clevisRightX, cy, cableZ + layers.T_FRAME / 2);
    bracketR.castShadow = true;
    rightSegGroup.add(bracketR);

    // Cable from clevis to right eye nut
    const cableR = buildCableRun([
      new THREE.Vector3(clevisRightX, cy, cableZ),
      new THREE.Vector3(rightX - eyeDims.ringOuter / 2, cy, cableZ),
    ], cableDims, mats);
    rightSegGroup.add(cableR.group);

    // Eye nut at right attachment point
    const eyeNutR = buildEyeNut(eyeDims, mats);
    eyeNutR.group.position.set(rightX, cy, cableZ);
    rightSegGroup.add(eyeNutR.group);

    cablesGroup.add(rightSegGroup);

    // ── BALL LOCK PINS (connecting left and right at the clevis point) ──
    // These are positioned between the two brackets, shared until fold disconnects them
    // Left pin (attached to left segment, inserts into right bracket)
    const pinL = buildClevisPin(pinDims, mats);
    pinL.group.position.set(clevisLeftX, cy, cableZ);
    // Rotate so shaft points along X toward hinge (horizontal)
    pinL.group.rotation.y = Math.PI / 2; // shaft along +X
    pinL.group.scale.set(0.6, 0.6, 0.6); // scale down — these are relative to the board
    leftSegGroup.add(pinL.group);

    // Right pin
    const pinR = buildClevisPin(pinDims, mats);
    pinR.group.position.set(clevisRightX, cy, cableZ);
    pinR.group.rotation.y = -Math.PI / 2; // shaft along -X
    pinR.group.scale.set(0.6, 0.6, 0.6);
    rightSegGroup.add(pinR.group);

    cableSegments.push({
      leftGroup: leftSegGroup,
      rightGroup: rightSegGroup,
      clevisLeftX, clevisRightX, cy,
      turnbuckleX: tbX,
    });
  });

  group.add(cablesGroup);

  // ── FOLD ANIMATION ──
  function applyFold(internalDeg) {
    const halfRad = (internalDeg * Math.PI / 180) / 2;
    const yAxis = new THREE.Vector3(0, 1, 0);
    const pivot = new THREE.Vector3(hingeX, hingeCenterY, hingeZ);

    // --- Hinge articulation ---
    if (hingeDef.foldType === 'piano') {
      // Piano hinge: rotate each leaf around the pin axis
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
            // Left leaf rotates with left half
            child.quaternion.premultiply(new THREE.Quaternion().setFromAxisAngle(yAxis, halfRad));
            // Offset position for leaf rotation around the pin (x=0 in hinge-local space)
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
        // Left cable segment follows left half fold (rotate around pivot)
        seg.leftGroup.children.forEach(child => {
          const p = child.position.clone().sub(pivot);
          p.applyAxisAngle(yAxis, halfRad);
          child.position.copy(p.add(pivot));
          child.quaternion.premultiply(new THREE.Quaternion().setFromAxisAngle(yAxis, halfRad));
        });
        // Right cable segment follows right half fold
        seg.rightGroup.children.forEach(child => {
          const p = child.position.clone().sub(pivot);
          p.applyAxisAngle(yAxis, -halfRad);
          child.position.copy(p.add(pivot));
          child.quaternion.premultiply(new THREE.Quaternion().setFromAxisAngle(yAxis, -halfRad));
        });
      }
    });
  }

  return { group, hingeResult, cablesGroup, cableSegments, applyFold };
}
