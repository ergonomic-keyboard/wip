// hardware-builders.js — Three.js geometry builders for hinge mechanism components.
// Builds accurate 3D models from catalog dimensions (mm).
// See hinge-design.md for mechanical design rationale.
//
// Architecture:
//   buildHardwareAssembly() composes:
//     1. Fold hinge (PHA 8mm or Bearing Pivot) — stays at center during fold
//     2. Butterfly joint (Hirth/Curvic/Serrated) — discs split between halves
//     3. Angled brackets — one per half, connects board edge to pivot center
//     4. Clamping hardware (thumb nut or cam lever + washer + bolt)
//     5. Cables (unchanged from previous implementation)

import * as THREE from 'three';
import { PIVOT_GEOMETRY } from './hardware-catalog.js';

// ═══════════════════════════════════════════════════════════════
// UTILITY: rounded box (no bevel on THREE.BoxGeometry, so approximate)
// ═══════════════════════════════════════════════════════════════

function makeRoundedBox(w, h, d, r, segs) {
  // Use a standard box — rounded edges are a visual nicety,
  // not structurally important. The small r on these parts
  // is not visible at keyboard scale.
  return new THREE.BoxGeometry(w, h, d);
}

// ═══════════════════════════════════════════════════════════════
// FOLD HINGE A: Reell PHA 8mm Friction Positioning Hinge
// ═══════════════════════════════════════════════════════════════

/**
 * Build the PHA 8mm friction hinge at origin.
 * Shaft runs along Y. Body sits below the shaft center.
 * Returns parts tagged for fold animation:
 *   _hingeCenter = true → stays at pivot center during fold
 *   _hingeLeaf = 'left'|'right' → rotates with that half
 *
 * @param {object} dims — from catalog foldHinges['pha-8mm'].dims
 * @param {object} mats — { steel, brass, chrome, copper }
 * @returns {{ group: THREE.Group, parts: object }}
 */
export function buildPHAHinge(dims, mats) {
  const group = new THREE.Group();
  group.userData.hwType = 'foldHinge';

  const { shaftDia, shaftLen, bodyLen, bodyWidth, bodyHeight,
          flagLeafLen, flagLeafWidth, flagLeafThick,
          screwHoleDia, screwHoleSpacing } = dims;

  const shaftR = shaftDia / 2;

  // ── Shaft: cylinder along Y axis ──
  const shaftGeo = new THREE.CylinderGeometry(shaftR, shaftR, shaftLen, 20);
  // CylinderGeometry default axis is Y — perfect
  const shaft = new THREE.Mesh(shaftGeo, mats.steel.clone());
  shaft.castShadow = true;
  shaft.userData._hingeCenter = true;
  shaft.userData._partName = 'PHA shaft';
  group.add(shaft);

  // ── Body: rectangular housing around the shaft ──
  // Body center sits offset in -Z (below shaft center) because the shaft
  // emerges from the top face of the body
  const bodyGeo = makeRoundedBox(bodyWidth, bodyLen, bodyHeight, 1.5, 2);
  const body = new THREE.Mesh(bodyGeo, mats.chrome.clone());
  body.position.set(0, 0, -bodyHeight / 2 + shaftR); // top face aligns with shaft center
  body.castShadow = true;
  body.userData._hingeCenter = true;
  body.userData._partName = 'PHA body';
  group.add(body);

  // ── Flag leaf: thin plate extending in -X from body ──
  // This is how the PHA mounts — the leaf bolts to the left bracket
  const leafGeo = new THREE.BoxGeometry(flagLeafLen, flagLeafWidth, flagLeafThick);
  const leaf = new THREE.Mesh(leafGeo, mats.steel.clone());
  leaf.position.set(-bodyWidth / 2 - flagLeafLen / 2, 0, -bodyHeight / 2 + shaftR);
  leaf.castShadow = true;
  leaf.userData._hingeLeaf = 'left';
  leaf.userData._partName = 'PHA flag leaf';
  group.add(leaf);

  // ── Screw holes in flag leaf (decorative dark cylinders) ──
  const screwGeo = new THREE.CylinderGeometry(screwHoleDia / 2, screwHoleDia / 2, flagLeafThick + 0.5, 8);
  screwGeo.rotateX(Math.PI / 2); // align screw axis to Z
  [-1, 1].forEach(dir => {
    const screw = new THREE.Mesh(screwGeo, mats.copper.clone());
    screw.position.set(
      leaf.position.x,
      dir * screwHoleSpacing / 2,
      leaf.position.z
    );
    screw.userData._hingeLeaf = 'left';
    group.add(screw);
  });

  // ── Shaft collar groove (decorative ring near each end) ──
  const grooveGeo = new THREE.TorusGeometry(shaftR + 0.2, 0.3, 6, 16);
  grooveGeo.rotateX(Math.PI / 2); // ring perpendicular to Y axis
  [-1, 1].forEach(dir => {
    const groove = new THREE.Mesh(grooveGeo, mats.steel.clone());
    groove.position.set(0, dir * (shaftLen / 2 - 2), 0);
    groove.userData._hingeCenter = true;
    group.add(groove);
  });

  return { group };
}

// ═══════════════════════════════════════════════════════════════
// FOLD HINGE B: Miniature Sealed-Bearing Pivot
// ═══════════════════════════════════════════════════════════════

/**
 * Build a miniature bearing pivot hinge at origin.
 * Pin runs along Y. Yoke (U-bracket) captures the pin via bearings.
 *
 * @param {object} dims — from catalog foldHinges['bearing-pivot'].dims
 * @param {object} mats — { steel, brass, chrome, copper }
 * @returns {{ group: THREE.Group }}
 */
export function buildBearingPivot(dims, mats) {
  const group = new THREE.Group();
  group.userData.hwType = 'foldHinge';

  const { pinDia, pinLen, bearingOD, bearingID, bearingWidth,
          yokeWidth, yokeHeight, yokeThick, yokeArmWidth,
          eClipDia, eClipThick } = dims;

  const pinR = pinDia / 2;
  const bearingR = bearingOD / 2;

  // ── Pivot pin: titanium cylinder along Y ──
  const pinGeo = new THREE.CylinderGeometry(pinR, pinR, pinLen, 16);
  const pin = new THREE.Mesh(pinGeo, mats.chrome.clone());
  pin.castShadow = true;
  pin.userData._hingeCenter = true;
  pin.userData._partName = 'Pivot pin';
  group.add(pin);

  // ── Bearings: torus shapes at each end of pin ──
  const bearingGeo = new THREE.CylinderGeometry(bearingR, bearingR, bearingWidth, 20);
  const bearingInnerGeo = new THREE.CylinderGeometry(pinR + 0.2, pinR + 0.2, bearingWidth + 0.2, 16);

  [-1, 1].forEach(dir => {
    const by = dir * (yokeWidth / 2 - bearingWidth / 2);

    // Outer race (visible ring)
    const outer = new THREE.Mesh(bearingGeo, mats.steel.clone());
    outer.position.set(0, by, 0);
    outer.castShadow = true;
    outer.userData._hingeCenter = true;
    outer.userData._partName = 'MR84ZZ bearing';
    group.add(outer);

    // Inner bore (dark cutout visual)
    const inner = new THREE.Mesh(bearingInnerGeo, mats.copper.clone());
    inner.position.set(0, by, 0);
    inner.userData._hingeCenter = true;
    group.add(inner);

    // Bearing shield line (decorative ring on face)
    const shieldGeo = new THREE.TorusGeometry((bearingR + pinR) / 2, 0.2, 6, 20);
    shieldGeo.rotateX(Math.PI / 2);
    const shield = new THREE.Mesh(shieldGeo, mats.steel.clone());
    shield.position.set(0, by + dir * (bearingWidth / 2 - 0.2), 0);
    shield.userData._hingeCenter = true;
    group.add(shield);
  });

  // ── Yoke: U-shaped bracket ──
  // Two arms extending down (-Z) from the bearing positions, connected by a base plate
  const armHeight = yokeHeight - bearingR;
  const armGeo = new THREE.BoxGeometry(yokeArmWidth, yokeThick, armHeight);

  [-1, 1].forEach(dir => {
    const arm = new THREE.Mesh(armGeo, mats.steel.clone());
    const ay = dir * (yokeWidth / 2 + yokeThick / 2);
    arm.position.set(0, ay, -armHeight / 2);
    arm.castShadow = true;
    arm.userData._hingeLeaf = 'right'; // yoke is bolted to right bracket
    arm.userData._partName = 'Yoke arm';
    group.add(arm);
  });

  // Yoke base (connects the two arms at bottom)
  const baseGeo = new THREE.BoxGeometry(yokeArmWidth, yokeWidth + yokeThick * 2, yokeThick);
  const base = new THREE.Mesh(baseGeo, mats.steel.clone());
  base.position.set(0, 0, -armHeight);
  base.castShadow = true;
  base.userData._hingeLeaf = 'right';
  base.userData._partName = 'Yoke base';
  group.add(base);

  // ── E-clips: thin rings at each end of pin ──
  const eClipGeo = new THREE.TorusGeometry(eClipDia / 2, eClipThick / 2, 4, 16);
  eClipGeo.rotateX(Math.PI / 2);

  [-1, 1].forEach(dir => {
    const clip = new THREE.Mesh(eClipGeo, mats.steel.clone());
    clip.position.set(0, dir * (pinLen / 2 - 1), 0);
    clip.userData._hingeCenter = true;
    clip.userData._partName = 'E-clip';
    group.add(clip);
  });

  return { group };
}

// ═══════════════════════════════════════════════════════════════
// ANGLED BRACKETS — connect board edge to pivot center
// ═══════════════════════════════════════════════════════════════

/**
 * Build a pair of angled mounting brackets.
 * Each bracket is an L-shape: a horizontal flange (bolts to board edge)
 * and an arm angled upward at bracketAngleDeg to reach the pivot center.
 *
 * Built at origin. The flange sits at Z=0 extending in ±X.
 * The arm rises to Z=pivotOffset at the tip.
 *
 * @param {object} dims — from catalog brackets['ss-bracket'].dims
 * @param {object} mats — { steel }
 * @param {string} side — 'left' or 'right'
 * @returns {{ group: THREE.Group }}
 */
export function buildBracket(dims, mats, side) {
  const group = new THREE.Group();
  group.userData.hwType = 'bracket';
  group.userData._hingeLeaf = side;

  const { armLen, armWidth, armThick, angleDeg, flangeLen, flangeThick,
          mountHoleDia, mountHoleCount, mountHoleSpacing } = dims;

  const angleRad = angleDeg * Math.PI / 180;
  const xDir = side === 'left' ? -1 : 1;

  // ── Flange: flat plate on board edge ──
  const flangeGeo = new THREE.BoxGeometry(flangeLen, armWidth, flangeThick);
  const flange = new THREE.Mesh(flangeGeo, mats.steel.clone());
  flange.position.set(xDir * flangeLen / 2, 0, flangeThick / 2);
  flange.castShadow = true;
  flange.userData._partName = `${side} bracket flange`;
  group.add(flange);

  // ── Arm: angled from flange top to pivot center ──
  // The arm is a box rotated by angleDeg around Y axis.
  // It extends from the board edge upward/inward to the pivot.
  const armGeo = new THREE.BoxGeometry(armLen, armWidth, armThick);
  const arm = new THREE.Mesh(armGeo, mats.steel.clone());

  // Position: center of arm along the angled path
  const armCenterX = xDir * (flangeLen + (armLen / 2) * Math.cos(angleRad));
  const armCenterZ = flangeThick + (armLen / 2) * Math.sin(angleRad);

  arm.position.set(armCenterX, 0, armCenterZ);
  // Rotate arm so it tilts upward: rotate around Y axis
  // For left bracket (going in -X then up), we rotate +angleDeg around Y
  // For right bracket (going in +X then up), we rotate -angleDeg around Y
  arm.rotation.y = -xDir * angleRad;
  arm.castShadow = true;
  arm.userData._partName = `${side} bracket arm`;
  group.add(arm);

  // ── Mount screw holes (decorative dark cylinders in flange) ──
  const holeGeo = new THREE.CylinderGeometry(mountHoleDia / 2, mountHoleDia / 2, flangeThick + 1, 8);
  holeGeo.rotateX(Math.PI / 2); // align to Z axis
  for (let i = 0; i < mountHoleCount; i++) {
    const hy = (i - (mountHoleCount - 1) / 2) * mountHoleSpacing;
    const hole = new THREE.Mesh(holeGeo, mats.copper.clone());
    hole.position.set(xDir * flangeLen / 2, hy, flangeThick / 2);
    group.add(hole);
  }

  return { group };
}

// ═══════════════════════════════════════════════════════════════
// BUTTERFLY JOINT 1: Hirth Coupling
// ═══════════════════════════════════════════════════════════════

/**
 * Build a single Hirth disc with radial V-groove teeth on one face.
 * Disc axis = Z. Teeth face up (+Z) or down (-Z) depending on teethFaceDir.
 *
 * @param {object} dims — from catalog butterflyJoints['hirth-24t'].dims
 * @param {object} mats — { steel }
 * @param {number} teethFaceDir — +1 = teeth face up, -1 = teeth face down
 * @param {string} side — 'left' or 'right' (for userData tagging)
 * @returns {{ group: THREE.Group }}
 */
export function buildHirthDisc(dims, mats, teethFaceDir, side) {
  const group = new THREE.Group();
  group.userData.hwType = 'butterflyDisc';
  group.userData._hingeLeaf = side;

  const { outerDia, innerBore, toothCount, toothHeightOD, toothBaseThick,
          discThick, earLen, earWidth, earThick, earHoleDia } = dims;

  const outerR = outerDia / 2;
  const innerR = innerBore / 2;
  const teethHeight = discThick - toothBaseThick;

  // ── Base disc (solid ring) ──
  const baseGeo = new THREE.RingGeometry(innerR, outerR, 48, 1);
  const baseExtrudeShape = new THREE.Shape();
  baseExtrudeShape.absarc(0, 0, outerR, 0, Math.PI * 2, false);
  const baseHole = new THREE.Path();
  baseHole.absarc(0, 0, innerR, 0, Math.PI * 2, true);
  baseExtrudeShape.holes.push(baseHole);

  const baseExtGeo = new THREE.ExtrudeGeometry(baseExtrudeShape, {
    depth: toothBaseThick,
    bevelEnabled: false,
  });
  baseExtGeo.rotateX(Math.PI / 2); // extrude along Z
  // After rotateX(PI/2), the extrude goes along -Y. We need it along Z.
  // Actually ExtrudeGeometry extrudes along +Z by default, then rotateX(PI/2) makes it +Y.
  // Let's just use a cylinder ring instead for simplicity:
  const ringGeo = cylinderRing(innerR, outerR, toothBaseThick, 48);
  const baseMesh = new THREE.Mesh(ringGeo, mats.steel.clone());
  baseMesh.castShadow = true;
  baseMesh.userData._partName = `Hirth disc base (${side})`;

  // Position: base sits below teeth. If teeth face up, base is at bottom.
  const baseZ = teethFaceDir > 0 ? -toothBaseThick / 2 : toothBaseThick / 2;
  baseMesh.position.z = baseZ;
  group.add(baseMesh);

  // ── Teeth: radial V-grooves ──
  // Each tooth is a triangular prism radiating from center.
  // We approximate with a series of wedge-shaped geometries.
  const toothAngle = (2 * Math.PI) / toothCount;
  const teethZ = teethFaceDir > 0 ? teethHeight / 2 : -teethHeight / 2;

  for (let i = 0; i < toothCount; i++) {
    const angle = i * toothAngle;
    const tooth = buildSingleHirthTooth(innerR, outerR, toothAngle, toothHeightOD, mats.steel);
    tooth.rotation.z = angle;
    tooth.position.z = teethZ;
    tooth.userData._hingeLeaf = side;
    group.add(tooth);
  }

  // ── Mounting ears (2× tabs extending beyond OD) ──
  const earGeo = new THREE.BoxGeometry(earLen, earWidth, earThick);
  [0, Math.PI].forEach((angle, idx) => {
    const ear = new THREE.Mesh(earGeo, mats.steel.clone());
    const ex = Math.cos(angle) * (outerR + earLen / 2);
    const ey = Math.sin(angle) * (outerR + earLen / 2);
    ear.position.set(ex, ey, baseZ);
    ear.rotation.z = angle;
    ear.castShadow = true;
    ear.userData._partName = `Hirth ear ${idx}`;
    ear.userData._hingeLeaf = side;
    group.add(ear);

    // Screw hole in ear
    const holeGeo = new THREE.CylinderGeometry(earHoleDia / 2, earHoleDia / 2, earThick + 0.5, 8);
    const hole = new THREE.Mesh(holeGeo, mats.copper.clone());
    hole.position.copy(ear.position);
    hole.userData._hingeLeaf = side;
    group.add(hole);
  });

  return { group };
}

/**
 * Build a single Hirth tooth (triangular radial wedge).
 * The tooth radiates from innerR to outerR, with V-profile cross-section.
 * Built flat (in XY plane), height along Z.
 */
function buildSingleHirthTooth(innerR, outerR, toothAngle, toothHeightOD, mat) {
  // Approximate a radial tooth with a custom BufferGeometry.
  // The tooth is a wedge: triangular cross-section (V-shape, peak at center
  // of tooth angular span, valleys at edges) that grows taller toward OD.

  const halfAngle = toothAngle / 2;
  const segments = 6; // radial subdivisions

  const positions = [];
  const normals = [];
  const indices = [];

  // Build vertex rings at different radii
  // At each radius r, we have 3 vertices across the tooth:
  //   left edge (valley, z=0), center (peak, z=toothH), right edge (valley, z=0)
  // toothH scales linearly with radius: h(r) = toothHeightOD * (r / outerR)
  const rings = [];
  for (let s = 0; s <= segments; s++) {
    const t = s / segments;
    const r = innerR + t * (outerR - innerR);
    const h = toothHeightOD * (r / outerR);

    // 3 vertices per ring: left-valley, center-peak, right-valley
    const leftAngle = -halfAngle;
    const centerAngle = 0;
    const rightAngle = halfAngle;

    rings.push([
      { x: r * Math.cos(leftAngle), y: r * Math.sin(leftAngle), z: 0 },
      { x: r * Math.cos(centerAngle), y: r * Math.sin(centerAngle), z: h },
      { x: r * Math.cos(rightAngle), y: r * Math.sin(rightAngle), z: 0 },
    ]);
  }

  // Build triangles between adjacent rings
  for (let s = 0; s < segments; s++) {
    const r0 = rings[s];
    const r1 = rings[s + 1];
    const baseIdx = positions.length / 3;

    // Push all 6 vertices (3 from each ring)
    for (const v of r0) { positions.push(v.x, v.y, v.z); normals.push(0, 0, 1); }
    for (const v of r1) { positions.push(v.x, v.y, v.z); normals.push(0, 0, 1); }

    // 4 quads (8 triangles) connecting the 3 vertices per ring
    // Left face: r0[0]-r0[1]-r1[1]-r1[0]
    indices.push(baseIdx + 0, baseIdx + 1, baseIdx + 4);
    indices.push(baseIdx + 0, baseIdx + 4, baseIdx + 3);
    // Right face: r0[1]-r0[2]-r1[2]-r1[1]
    indices.push(baseIdx + 1, baseIdx + 2, baseIdx + 5);
    indices.push(baseIdx + 1, baseIdx + 5, baseIdx + 4);
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geo.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3));
  geo.setIndex(indices);
  geo.computeVertexNormals();

  return new THREE.Mesh(geo, mat.clone());
}

// ═══════════════════════════════════════════════════════════════
// BUTTERFLY JOINT 2: Curvic Coupling
// ═══════════════════════════════════════════════════════════════

/**
 * Build a single Curvic disc with arc-shaped teeth.
 * Similar to Hirth but teeth have curved (concave or convex) profiles
 * instead of straight V-grooves.
 *
 * @param {object} dims — from catalog butterflyJoints['curvic-36t'].dims
 * @param {object} mats — { steel }
 * @param {number} teethFaceDir — +1 = teeth face up, -1 = teeth face down
 * @param {string} side — 'left' or 'right'
 * @param {boolean} convex — true = convex teeth, false = concave
 * @returns {{ group: THREE.Group }}
 */
export function buildCurvicDisc(dims, mats, teethFaceDir, side, convex) {
  const group = new THREE.Group();
  group.userData.hwType = 'butterflyDisc';
  group.userData._hingeLeaf = side;

  const { outerDia, innerBore, toothCount, toothHeightOD, toothBaseThick,
          discThick, earLen, earWidth, earThick, earHoleDia } = dims;

  const outerR = outerDia / 2;
  const innerR = innerBore / 2;

  // ── Base ring ──
  const ringGeo = cylinderRing(innerR, outerR, toothBaseThick, 48);
  const baseMesh = new THREE.Mesh(ringGeo, mats.steel.clone());
  baseMesh.castShadow = true;
  baseMesh.userData._partName = `Curvic disc base (${side})`;
  const baseZ = teethFaceDir > 0 ? -toothBaseThick / 2 : toothBaseThick / 2;
  baseMesh.position.z = baseZ;
  group.add(baseMesh);

  // ── Arc teeth ──
  // Curvic teeth are similar to Hirth but with a curved profile.
  // We approximate by making the tooth peak rounded instead of sharp V.
  const toothAngle = (2 * Math.PI) / toothCount;
  const teethHeight = discThick - toothBaseThick;
  const teethZ = teethFaceDir > 0 ? teethHeight / 2 : -teethHeight / 2;

  for (let i = 0; i < toothCount; i++) {
    const angle = i * toothAngle;
    const tooth = buildSingleCurvicTooth(innerR, outerR, toothAngle, toothHeightOD, convex, mats.steel);
    tooth.rotation.z = angle;
    tooth.position.z = teethZ;
    tooth.userData._hingeLeaf = side;
    group.add(tooth);
  }

  // ── Mounting ears ──
  const earGeo = new THREE.BoxGeometry(earLen, earWidth, earThick);
  [0, Math.PI].forEach((angle, idx) => {
    const ear = new THREE.Mesh(earGeo, mats.steel.clone());
    ear.position.set(
      Math.cos(angle) * (outerR + earLen / 2),
      Math.sin(angle) * (outerR + earLen / 2),
      baseZ
    );
    ear.rotation.z = angle;
    ear.castShadow = true;
    ear.userData._hingeLeaf = side;
    group.add(ear);

    const holeGeo = new THREE.CylinderGeometry(earHoleDia / 2, earHoleDia / 2, earThick + 0.5, 8);
    const hole = new THREE.Mesh(holeGeo, mats.copper.clone());
    hole.position.copy(ear.position);
    hole.userData._hingeLeaf = side;
    group.add(hole);
  });

  return { group };
}

/**
 * Build a single Curvic tooth with an arc profile.
 * The cross-section is a rounded bump (convex) or dip (concave).
 */
function buildSingleCurvicTooth(innerR, outerR, toothAngle, toothHeightOD, convex, mat) {
  const halfAngle = toothAngle / 2;
  const segments = 6;
  const crossSegments = 4; // subdivisions across the tooth for curved profile

  const positions = [];
  const indices = [];

  // Build vertex rings at different radii
  for (let s = 0; s <= segments; s++) {
    const t = s / segments;
    const r = innerR + t * (outerR - innerR);
    const maxH = toothHeightOD * (r / outerR);

    // Cross-section: arc profile from -halfAngle to +halfAngle
    // For convex: peak at center, zero at edges (like Hirth but curved)
    // For concave: valley at center, peak at edges (inverted)
    for (let c = 0; c <= crossSegments; c++) {
      const ct = c / crossSegments; // 0 → 1 across tooth
      const crossAngle = -halfAngle + ct * toothAngle;

      // Height profile: sinusoidal curve for smooth arc
      let h;
      if (convex) {
        h = maxH * Math.cos((ct - 0.5) * Math.PI); // peak at center
        h = Math.max(0, h);
      } else {
        h = maxH * (1 - Math.cos((ct - 0.5) * Math.PI)); // valley at center
        h = Math.max(0, h);
      }

      positions.push(
        r * Math.cos(crossAngle),
        r * Math.sin(crossAngle),
        h
      );
    }
  }

  // Build triangles
  const vertsPerRing = crossSegments + 1;
  for (let s = 0; s < segments; s++) {
    for (let c = 0; c < crossSegments; c++) {
      const i0 = s * vertsPerRing + c;
      const i1 = i0 + 1;
      const i2 = (s + 1) * vertsPerRing + c;
      const i3 = i2 + 1;
      indices.push(i0, i1, i2);
      indices.push(i1, i3, i2);
    }
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geo.setIndex(indices);
  geo.computeVertexNormals();

  return new THREE.Mesh(geo, mat.clone());
}

// ═══════════════════════════════════════════════════════════════
// BUTTERFLY JOINT 3: Serrated-Face Flange
// ═══════════════════════════════════════════════════════════════

/**
 * Build a single serrated face disc with fine radial teeth.
 * Much thinner than Hirth/Curvic. Teeth are shallow (0.5mm).
 *
 * @param {object} dims — from catalog butterflyJoints['serrated-72t'].dims
 * @param {object} mats — { brass } (aluminum rendered as brass-ish)
 * @param {number} teethFaceDir — +1 or -1
 * @param {string} side — 'left' or 'right'
 * @returns {{ group: THREE.Group }}
 */
export function buildSerratedDisc(dims, mats, teethFaceDir, side) {
  const group = new THREE.Group();
  group.userData.hwType = 'butterflyDisc';
  group.userData._hingeLeaf = side;

  const { outerDia, innerBore, toothCount, serrationDepth, toothBaseThick,
          discThick, earLen, earWidth, earThick, earHoleDia } = dims;

  const outerR = outerDia / 2;
  const innerR = innerBore / 2;

  // ── Base ring ──
  const ringGeo = cylinderRing(innerR, outerR, toothBaseThick, 48);
  const baseMesh = new THREE.Mesh(ringGeo, mats.brass.clone());
  baseMesh.castShadow = true;
  baseMesh.userData._partName = `Serrated disc base (${side})`;
  const baseZ = teethFaceDir > 0 ? -toothBaseThick / 2 : toothBaseThick / 2;
  baseMesh.position.z = baseZ;
  group.add(baseMesh);

  // ── Serration teeth ──
  // Fine radial serrations — same geometry approach as Hirth but much shallower
  const toothAngle = (2 * Math.PI) / toothCount;
  const teethZ = teethFaceDir > 0 ? serrationDepth / 2 : -serrationDepth / 2;

  for (let i = 0; i < toothCount; i++) {
    const angle = i * toothAngle;
    // Reuse Hirth tooth builder with shallow height
    const tooth = buildSingleHirthTooth(innerR, outerR, toothAngle, serrationDepth, mats.brass);
    tooth.rotation.z = angle;
    tooth.position.z = teethZ;
    tooth.userData._hingeLeaf = side;
    group.add(tooth);
  }

  // ── Mounting ears (smaller than Hirth) ──
  const earGeo = new THREE.BoxGeometry(earLen, earWidth, earThick);
  [0, Math.PI].forEach((angle, idx) => {
    const ear = new THREE.Mesh(earGeo, mats.brass.clone());
    ear.position.set(
      Math.cos(angle) * (outerR + earLen / 2),
      Math.sin(angle) * (outerR + earLen / 2),
      baseZ
    );
    ear.rotation.z = angle;
    ear.castShadow = true;
    ear.userData._hingeLeaf = side;
    group.add(ear);

    const holeGeo = new THREE.CylinderGeometry(earHoleDia / 2, earHoleDia / 2, earThick + 0.5, 8);
    const hole = new THREE.Mesh(holeGeo, mats.copper.clone());
    hole.position.copy(ear.position);
    hole.userData._hingeLeaf = side;
    group.add(hole);
  });

  return { group };
}

// ═══════════════════════════════════════════════════════════════
// CLAMPING HARDWARE (thumb nut or cam lever)
// ═══════════════════════════════════════════════════════════════

/**
 * Build the axial clamping assembly for the butterfly joint.
 * Sits above the upper butterfly disc.
 *
 * @param {string} clampType — 'thumbnut' or 'camlever'
 * @param {object} butterflyDims — butterfly joint dims (for bore diameter)
 * @param {object} mats — { brass, steel, chrome }
 * @returns {{ group: THREE.Group }}
 */
export function buildClampAssembly(clampType, butterflyDims, mats) {
  const group = new THREE.Group();
  group.userData.hwType = 'clamp';

  const boltR = 2; // M4 bolt radius
  const boreR = butterflyDims.innerBore / 2;

  if (clampType === 'thumbnut') {
    // ── M4 bolt: runs vertically through everything ──
    const boltLen = 20;
    const boltGeo = new THREE.CylinderGeometry(boltR, boltR, boltLen, 8);
    boltGeo.rotateX(Math.PI / 2); // align to Z
    const bolt = new THREE.Mesh(boltGeo, mats.steel.clone());
    bolt.position.z = boltLen / 2 - 5; // centered around discs
    bolt.castShadow = true;
    bolt.userData._hingeCenter = true;
    bolt.userData._partName = 'M4 clamping bolt';
    group.add(bolt);

    // ── Belleville washer ──
    const bellGeo = cylinderRing(boltR + 0.5, 5, 1.5, 16);
    const bell = new THREE.Mesh(bellGeo, mats.steel.clone());
    bell.position.z = 8;
    bell.castShadow = true;
    bell.userData._hingeCenter = true;
    bell.userData._partName = 'Belleville washer';
    group.add(bell);

    // ── Knurled thumb nut ──
    const nutR = 7; // 14mm OD
    const nutH = 8;
    const nutGeo = new THREE.CylinderGeometry(nutR, nutR, nutH, 24);
    nutGeo.rotateX(Math.PI / 2); // align to Z
    const nut = new THREE.Mesh(nutGeo, mats.brass.clone());
    nut.position.z = 12;
    nut.castShadow = true;
    nut.userData._hingeCenter = true;
    nut.userData._partName = 'M4 thumb nut';
    group.add(nut);

    // Knurling lines on thumb nut (decorative vertical grooves)
    const knurlCount = 24;
    for (let i = 0; i < knurlCount; i++) {
      const knurlAngle = (i / knurlCount) * Math.PI * 2;
      const kx = Math.cos(knurlAngle) * (nutR - 0.2);
      const ky = Math.sin(knurlAngle) * (nutR - 0.2);
      const knurlGeo = new THREE.BoxGeometry(0.4, 0.4, nutH - 1);
      const knurl = new THREE.Mesh(knurlGeo, mats.brass.clone());
      knurl.position.set(kx, ky, 12);
      knurl.userData._hingeCenter = true;
      group.add(knurl);
    }
  } else {
    // ── Cam lever (quarter-turn quick-lock) ──
    const camDims = butterflyDims;

    // M4 shoulder bolt (shorter than thumb nut bolt)
    const boltLen = 16;
    const boltGeo = new THREE.CylinderGeometry(boltR, boltR, boltLen, 8);
    boltGeo.rotateX(Math.PI / 2);
    const bolt = new THREE.Mesh(boltGeo, mats.steel.clone());
    bolt.position.z = boltLen / 2 - 5;
    bolt.castShadow = true;
    bolt.userData._hingeCenter = true;
    bolt.userData._partName = 'M4 shoulder bolt';
    group.add(bolt);

    // Wave washer
    const waveGeo = cylinderRing(boltR + 0.5, 5, 0.8, 16);
    const wave = new THREE.Mesh(waveGeo, mats.steel.clone());
    wave.position.z = 6;
    wave.castShadow = true;
    wave.userData._hingeCenter = true;
    wave.userData._partName = 'Wave washer';
    group.add(wave);

    // Cam body (eccentric cylinder)
    const camBodyR = 5;
    const camBodyH = 3;
    const camBodyGeo = new THREE.CylinderGeometry(camBodyR, camBodyR, camBodyH, 16);
    camBodyGeo.rotateX(Math.PI / 2);
    const camBody = new THREE.Mesh(camBodyGeo, mats.chrome.clone());
    camBody.position.z = 9;
    camBody.castShadow = true;
    camBody.userData._hingeCenter = true;
    camBody.userData._partName = 'Cam body';
    group.add(camBody);

    // Cam lever arm
    const leverLen = camDims.camLeverLen || 18;
    const leverGeo = new THREE.BoxGeometry(leverLen, camDims.camLeverWidth || 5, camDims.camLeverThick || 2);
    const lever = new THREE.Mesh(leverGeo, mats.chrome.clone());
    lever.position.set(leverLen / 2, 0, 9);
    lever.castShadow = true;
    lever.userData._hingeCenter = true;
    lever.userData._partName = 'Cam lever';
    group.add(lever);

    // Lever grip (rounded end)
    const gripGeo = new THREE.SphereGeometry(3, 12, 8);
    const grip = new THREE.Mesh(gripGeo, mats.chrome.clone());
    grip.position.set(leverLen, 0, 9);
    grip.castShadow = true;
    grip.userData._hingeCenter = true;
    group.add(grip);
  }

  return { group };
}

// ═══════════════════════════════════════════════════════════════
// HELPER: cylinder ring (annular disc) geometry
// ═══════════════════════════════════════════════════════════════

/**
 * Create a cylindrical ring (washer/disc shape) geometry.
 * Axis along Z. Centered at origin.
 * @param {number} innerR
 * @param {number} outerR
 * @param {number} height
 * @param {number} segments
 */
function cylinderRing(innerR, outerR, height, segments) {
  // Use LatheGeometry with a rectangular profile for a clean ring
  const halfH = height / 2;
  const pts = [
    new THREE.Vector2(innerR, -halfH),
    new THREE.Vector2(outerR, -halfH),
    new THREE.Vector2(outerR, halfH),
    new THREE.Vector2(innerR, halfH),
  ];
  return new THREE.LatheGeometry(pts, segments);
}

// ═══════════════════════════════════════════════════════════════
// TURNBUCKLE (unchanged)
// ═══════════════════════════════════════════════════════════════

export function buildTurnbuckle(dims, mats) {
  const group = new THREE.Group();
  group.userData.hwType = 'turnbuckle';

  const { eyeToEye, bodyLen, bodyDia, rodDia, eyeInner, eyeOuter, eyeThick } = dims;
  const halfBody = bodyLen / 2;
  const rodLen = (eyeToEye - bodyLen) / 2 - eyeOuter / 2;

  const bodyGeo = new THREE.CylinderGeometry(bodyDia / 2, bodyDia / 2, bodyLen, 6);
  bodyGeo.rotateZ(Math.PI / 2);
  const body = new THREE.Mesh(bodyGeo, mats.chrome.clone());
  body.castShadow = true;
  group.add(body);

  [-1, 1].forEach(dir => {
    const rGeo = new THREE.CylinderGeometry(rodDia / 2, rodDia / 2, rodLen, 8);
    rGeo.rotateZ(Math.PI / 2);
    const rod = new THREE.Mesh(rGeo, mats.steel.clone());
    rod.position.x = dir * (halfBody + rodLen / 2);
    rod.castShadow = true;
    group.add(rod);

    const eyeR = (eyeInner + eyeOuter / 2) / 2;
    const eyeTube = (eyeOuter - eyeInner) / 2;
    const eyeGeo = new THREE.TorusGeometry(eyeR, Math.max(0.3, eyeTube), 8, 16);
    eyeGeo.rotateY(Math.PI / 2);
    const eye = new THREE.Mesh(eyeGeo, mats.steel.clone());
    eye.position.x = dir * (halfBody + rodLen + eyeR);
    eye.castShadow = true;
    group.add(eye);
  });

  return { group };
}

// ═══════════════════════════════════════════════════════════════
// EYE NUT (unchanged)
// ═══════════════════════════════════════════════════════════════

export function buildEyeNut(dims, mats) {
  const group = new THREE.Group();
  group.userData.hwType = 'eyeNut';

  const { ringInner, ringOuter, ringThick, nutAF, nutHeight, threadDia, boltLen } = dims;

  const ringR = (ringInner + ringOuter) / 4;
  const ringTubeR = (ringOuter - ringInner) / 4;
  const ringGeo = new THREE.TorusGeometry(ringR, ringTubeR, 12, 24);
  ringGeo.rotateY(Math.PI / 2);
  const ring = new THREE.Mesh(ringGeo, mats.brass.clone());
  ring.castShadow = true;
  group.add(ring);

  const nutGeo = new THREE.CylinderGeometry(nutAF / 2, nutAF / 2, nutHeight, 6);
  nutGeo.rotateX(Math.PI / 2);
  const nut = new THREE.Mesh(nutGeo, mats.brass.clone());
  nut.position.z = -(ringR + ringTubeR) - nutHeight / 2 + ringTubeR;
  nut.castShadow = true;
  group.add(nut);

  const boltGeo = new THREE.CylinderGeometry(threadDia / 2, threadDia / 2, boltLen, 8);
  boltGeo.rotateX(Math.PI / 2);
  const bolt = new THREE.Mesh(boltGeo, mats.steel.clone());
  bolt.position.z = nut.position.z + boltLen / 2;
  bolt.castShadow = true;
  group.add(bolt);

  return { group };
}

// ═══════════════════════════════════════════════════════════════
// BALL LOCK PIN (unchanged)
// ═══════════════════════════════════════════════════════════════

export function buildClevisPin(dims, mats) {
  const group = new THREE.Group();
  group.userData.hwType = 'clevisPin';

  const { shaftDia, bodyDia, buttonDia, gripLen, handleLen, ballDia, ballCount } = dims;

  const bodyGeo = new THREE.CylinderGeometry(bodyDia / 2, bodyDia / 2, handleLen, 16);
  bodyGeo.rotateX(Math.PI / 2);
  const body = new THREE.Mesh(bodyGeo, mats.chrome.clone());
  body.position.z = handleLen / 2;
  body.castShadow = true;
  group.add(body);

  const btnGeo = new THREE.CylinderGeometry(buttonDia / 2, buttonDia / 2, 2, 16);
  btnGeo.rotateX(Math.PI / 2);
  const btn = new THREE.Mesh(btnGeo, mats.steel.clone());
  btn.position.z = handleLen + 1;
  btn.castShadow = true;
  group.add(btn);

  const shaftGeo = new THREE.CylinderGeometry(shaftDia / 2, shaftDia / 2, gripLen, 12);
  shaftGeo.rotateX(Math.PI / 2);
  const shaft = new THREE.Mesh(shaftGeo, mats.chrome.clone());
  shaft.position.z = -gripLen / 2;
  shaft.castShadow = true;
  group.add(shaft);

  const ballGeo = new THREE.SphereGeometry(ballDia / 2, 8, 8);
  for (let i = 0; i < ballCount; i++) {
    const angle = (i / ballCount) * Math.PI * 2;
    const ball = new THREE.Mesh(ballGeo, mats.steel.clone());
    ball.position.set(
      Math.cos(angle) * (shaftDia / 2 + ballDia / 4),
      Math.sin(angle) * (shaftDia / 2 + ballDia / 4),
      -gripLen + ballDia
    );
    ball.castShadow = true;
    group.add(ball);
  }

  const tipGeo = new THREE.ConeGeometry(shaftDia / 2, 2, 12);
  tipGeo.rotateX(Math.PI / 2);
  const tip = new THREE.Mesh(tipGeo, mats.chrome.clone());
  tip.position.z = -gripLen - 1;
  tip.rotation.x = Math.PI;
  tip.castShadow = true;
  group.add(tip);

  return { group };
}

// ═══════════════════════════════════════════════════════════════
// CABLE RUN (unchanged)
// ═══════════════════════════════════════════════════════════════

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
 * Build the complete hinge assembly: fold hinge + butterfly joint + brackets + cables.
 *
 * @param {object} catalog — HARDWARE_CATALOG
 * @param {object} selection — { foldHinge, butterflyJoint, bracket, turnbuckle, eyeNut, clevisPin, cable }
 * @param {object} mats — { steel, brass, chrome, copper, cable }
 * @param {object} geo — board geometry info
 * @returns {{ group, hingeResult, cablesGroup, cableSegments, applyFold, ... }}
 */
export function buildHardwareAssembly(catalog, selection, mats, geo) {
  const group = new THREE.Group();
  const { hingeX, hingeCenterY, hingeZ, bbox, boardSpan,
          cableAttachPoints, cableZ, layers } = geo;

  const pivotOffset = PIVOT_GEOMETRY.pivotOffset;
  const pivotZ = hingeZ + pivotOffset; // raised pivot center

  // ═══ FOLD HINGE ═══
  const foldDef = catalog.foldHinges[selection.foldHinge];
  let hingeResult;

  if (foldDef.foldType === 'pha') {
    hingeResult = buildPHAHinge(foldDef.dims, mats);
  } else {
    hingeResult = buildBearingPivot(foldDef.dims, mats);
  }
  // Position at pivot center
  hingeResult.group.position.set(hingeX, hingeCenterY, pivotZ);
  group.add(hingeResult.group);

  // ═══ BUTTERFLY JOINT ═══
  const bflyDef = catalog.butterflyJoints[selection.butterflyJoint];
  const butterflyGroup = new THREE.Group();
  butterflyGroup.userData.hwType = 'butterflyJoint';

  let lowerDisc, upperDisc;
  if (bflyDef.jointType === 'hirth') {
    lowerDisc = buildHirthDisc(bflyDef.dims, mats, +1, 'left');  // teeth face up
    upperDisc = buildHirthDisc(bflyDef.dims, mats, -1, 'right'); // teeth face down
  } else if (bflyDef.jointType === 'curvic') {
    lowerDisc = buildCurvicDisc(bflyDef.dims, mats, +1, 'left', true);   // convex up
    upperDisc = buildCurvicDisc(bflyDef.dims, mats, -1, 'right', false); // concave down
  } else {
    lowerDisc = buildSerratedDisc(bflyDef.dims, mats, +1, 'left');
    upperDisc = buildSerratedDisc(bflyDef.dims, mats, -1, 'right');
  }

  // Position discs at pivot center, stacked vertically
  const discHalfGap = 0.5; // small gap between teeth faces when engaged
  lowerDisc.group.position.set(hingeX, hingeCenterY, pivotZ - discHalfGap);
  upperDisc.group.position.set(hingeX, hingeCenterY, pivotZ + discHalfGap);
  butterflyGroup.add(lowerDisc.group);
  butterflyGroup.add(upperDisc.group);

  // ═══ CLAMP ASSEMBLY ═══
  const clampResult = buildClampAssembly(bflyDef.clampType, bflyDef.dims, mats);
  clampResult.group.position.set(hingeX, hingeCenterY, pivotZ);
  butterflyGroup.add(clampResult.group);

  group.add(butterflyGroup);

  // ═══ ANGLED BRACKETS ═══
  const bracketDef = catalog.brackets[selection.bracket];
  const leftBracket = buildBracket(bracketDef.dims, mats, 'left');
  const rightBracket = buildBracket(bracketDef.dims, mats, 'right');

  // Brackets are positioned at the board inner edge, extending inward+upward to pivot
  // Their Z=0 is at Z_SWITCH_PLATE_TOP (board top surface),
  // their tip reaches pivotZ = hingeZ + pivotOffset
  leftBracket.group.position.set(hingeX, hingeCenterY, hingeZ);
  rightBracket.group.position.set(hingeX, hingeCenterY, hingeZ);
  group.add(leftBracket.group);
  group.add(rightBracket.group);

  // ═══ CABLES (same as before) ═══
  const cablesGroup = new THREE.Group();
  const cableSegments = [];
  const { nearLeftX, nearRightX, farLeftX, farRightX, nearCableY, farCableY } = cableAttachPoints;

  const cableDef = catalog.cables[selection.cable];
  const cableDims = cableDef.dims;
  const CABLE_SEGMENTS = 24;

  const cableConfigs = [
    { cy: nearCableY, leftX: nearLeftX, rightX: nearRightX, label: 'near' },
    { cy: farCableY,  leftX: farLeftX,  rightX: farRightX,  label: 'far' },
  ];

  cableConfigs.forEach(({ cy, leftX, rightX, label }) => {
    const bracketX = rightX;
    const straightDist = bracketX - leftX;
    const cableLength = straightDist * 1.15;

    const cablePts = [];
    for (let i = 0; i <= CABLE_SEGMENTS; i++) {
      const t = i / CABLE_SEGMENTS;
      const sag = -5 * 4 * t * (1 - t);
      cablePts.push(new THREE.Vector3(
        leftX + t * (bracketX - leftX),
        cy,
        cableZ + sag
      ));
    }
    const cableCurve = new THREE.CatmullRomCurve3(cablePts);
    const cableTubeGeo = new THREE.TubeGeometry(cableCurve, CABLE_SEGMENTS, cableDims.diameter / 2, 8, false);
    const cableTube = new THREE.Mesh(cableTubeGeo, mats.cable.clone());
    cableTube.castShadow = true;
    cableTube.userData._cableTube = true;
    cableTube.userData._cableLabel = label;
    cablesGroup.add(cableTube);

    const anchorGeo = new THREE.SphereGeometry(cableDims.diameter, 8, 8);
    const anchorL = new THREE.Mesh(anchorGeo, mats.steel.clone());
    anchorL.position.set(leftX, cy, cableZ);
    cablesGroup.add(anchorL);
    const anchorR = new THREE.Mesh(anchorGeo, mats.steel.clone());
    anchorR.position.set(bracketX, cy, cableZ);
    cablesGroup.add(anchorR);

    cableSegments.push({
      cableTube, cy, label,
      anchorX: leftX,
      bracketX: bracketX,
      cableLength,
      connected: true,
      freeEndPos: new THREE.Vector3(bracketX, cy, cableZ),
    });
  });

  group.add(cablesGroup);

  // ═══ FOLD ANIMATION ═══

  // Helper: rotate a group around an arbitrary pivot point in its parent space.
  // Saves/restores original transform so repeated calls don't compound.
  function rotateGroupAroundPivot(grp, pivot, axis, angle) {
    if (!grp.userData._origPos) {
      grp.userData._origPos = grp.position.clone();
      grp.userData._origQuat = grp.quaternion.clone();
    }
    grp.position.copy(grp.userData._origPos);
    grp.quaternion.copy(grp.userData._origQuat);

    if (angle === 0) return;

    // Translate so pivot is at origin, rotate, translate back
    const q = new THREE.Quaternion().setFromAxisAngle(axis, angle);
    const offset = grp.userData._origPos.clone().sub(pivot);
    offset.applyQuaternion(q);
    grp.position.copy(pivot).add(offset);
    grp.quaternion.premultiply(q);
  }

  function applyFold(internalDeg) {
    const halfRad = (internalDeg * Math.PI / 180) / 2;
    const yAxis = new THREE.Vector3(0, 1, 0);
    const pivot = new THREE.Vector3(hingeX, hingeCenterY, pivotZ);

    // --- Fold hinge articulation ---
    // Individual parts inside the fold hinge group. The group itself is at the pivot.
    // Parts are in the group's local space (origin = pivot), so we rotate around local origin.
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
          const p = child.position.clone().applyAxisAngle(yAxis, halfRad);
          child.position.copy(p);
        } else if (leaf === 'right') {
          child.quaternion.premultiply(new THREE.Quaternion().setFromAxisAngle(yAxis, -halfRad));
          const p = child.position.clone().applyAxisAngle(yAxis, -halfRad);
          child.position.copy(p);
        }
        // _hingeCenter parts stay put
      }
    });

    // --- Butterfly discs: rotate as whole groups around the pivot ---
    // Lower disc (left half) rotates +halfRad around Y
    // Upper disc (right half) rotates -halfRad around Y
    // The disc groups are positioned in the assembly group's space (boardRoot space)
    rotateGroupAroundPivot(lowerDisc.group, pivot, yAxis, halfRad);
    rotateGroupAroundPivot(upperDisc.group, pivot, yAxis, -halfRad);

    // Clamp assembly stays at center (it's the bolt/nut on the axis)
    rotateGroupAroundPivot(clampResult.group, pivot, yAxis, 0);

    // --- Brackets: rotate as whole groups around the pivot ---
    rotateGroupAroundPivot(leftBracket.group, pivot, yAxis, halfRad);
    rotateGroupAroundPivot(rightBracket.group, pivot, yAxis, -halfRad);

    // --- Cable segments ---
    cablesGroup.visible = true;
    cableSegments.forEach(seg => {
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

      const dist = anchorWorld.distanceTo(bracketWorld);

      if (seg.connected && dist <= seg.cableLength) {
        const sag = Math.max(2, (seg.cableLength - dist) * 0.5);
        updateCableCatenary(seg.cableTube, anchorWorld, bracketWorld, sag, CABLE_SEGMENTS, cableDims);
      } else {
        seg.connected = false;
        const hangLen = Math.min(seg.cableLength * 0.6, 40);
        const freeEnd = anchorWorld.clone();
        freeEnd.z -= hangLen;
        freeEnd.x += 5;
        seg.freeEndPos.copy(freeEnd);
        updateCableCatenary(seg.cableTube, anchorWorld, freeEnd, hangLen * 0.3, CABLE_SEGMENTS, cableDims);
      }
    });
  }

  function updateCableCatenary(tubeMesh, start, end, sag, segments, cblDims) {
    const pts = [];
    for (let i = 0; i <= segments; i++) {
      const t = i / segments;
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

  function connectCable(cableIdx) {
    const seg = cableSegments[cableIdx];
    if (!seg || seg.connected) return false;
    seg.connected = true;
    return true;
  }

  function disconnectCable(cableIdx) {
    const seg = cableSegments[cableIdx];
    if (!seg || !seg.connected) return;
    seg.connected = false;
  }

  function setCableFreeEnd(cableIdx, worldPos) {
    const seg = cableSegments[cableIdx];
    if (!seg || seg.connected) return;
    seg.freeEndPos.copy(worldPos);
  }

  return {
    group, hingeResult, cablesGroup, cableSegments, applyFold,
    connectCable, disconnectCable, setCableFreeEnd,
    pivotZ, // expose for render3d.js to use
  };
}
