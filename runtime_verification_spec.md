# Runtime Verification Specification

> This specification describes the runtime verification methodology for requirements
> that failed user inspection despite passing static code analysis. Each requirement
> has a detailed verification procedure, acceptance criteria, and method classification.

## Method Classification

- **[AUTO]** — Fully automated. Playwright drives a headless browser, queries the DOM
  or Three.js scene graph, and asserts pass/fail programmatically. No human review needed.
- **[AI]** — Automated pre-check plus screenshot capture. The automated checks verify
  structural properties (vertex counts, geometry types, Z-positions), but the final
  judgment of visual quality requires AI or human screenshot review. These substeps are
  clearly marked below.

## Why Runtime Verification

Static code analysis (regex on source files) cannot detect:
1. **Module initialization failures** — Temporal Dead Zone (TDZ) errors in `type="module"`
   scripts kill the entire module silently. No DOM elements are created, no event handlers fire.
2. **Rendering pipeline failures** — A mesh may be defined in code but positioned at wrong Z,
   using the wrong material, or invisible due to parent group visibility.
3. **Fold mechanics** — The `applyFold()` function may rotate halves in the wrong direction
   (outward instead of inward). Only a world-space normal check can verify this.
4. **Visual artifacts** — Jagged outlines, missing labels, invisible layers are only
   detectable by rendering the scene and inspecting the result.

---

## L01 — Canvas click handler fires [AUTO]

**Requirement**: REQ-L01 — System captures finger tap positions on canvas.

**What previously failed**: Module script had a Temporal Dead Zone error (`let thumbMode`
used before declaration), killing the entire `type="module"` script. Canvas click handler
never registered. All toolbar buttons (including column selectors) never created.

**Verification procedure**:
1. Load `wizard.html` in headless Chromium
2. Wait 2s for module script initialization
3. Assert: no `ReferenceError` or `Cannot access` in console errors
4. Assert: `.canvas-wrap canvas` element exists with `width > 0` and `height > 0`
5. Assert: `#page1 .toolbar` exists (proof module executed past the TDZ point)
6. Assert: toolbar has ≥6 `.col-btn` elements (pinky, ring, middle, index, inner, thumb)
7. Click center of canvas
8. Wait 200ms
9. Assert: active column button's count incremented (tap registered)

**Acceptance criteria**: All assertions pass. A single `ReferenceError` = FAIL.

---

## L06 — Load button present [AUTO]

**Requirement**: REQ-L06 — Thumb cluster has independent splay. (The Load button is a
UI element required by the system to reload layout data per REQ-L10.)

**What previously failed**: TDZ crash prevented toolbar construction. Load button was
dynamically created in JavaScript that never executed.

**Verification procedure**:
1. (After L01 page load) Query `#page1 .toolbar` for buttons containing text "Load"
2. Assert: button found
3. Assert: button has `width > 0` and `height > 0` (visible)
4. Check for associated hidden `<input type="file">` elements

**Acceptance criteria**: Load button exists, is visible, and has non-zero dimensions.

---

## L10 — Export button present [AUTO]

**Requirement**: REQ-L10 — User can export and reload layout data as JSON.

**What previously failed**: Same TDZ crash as L06. Export button never created.

**Verification procedure**:
1. Query toolbar for buttons containing text "Export", "Save", or "Download"
2. Assert: button found
3. Assert: button visible (non-zero bounding box)

**Acceptance criteria**: Export button exists and is visible.

---

## R03 — All layer components visible in 3D scene [AUTO]

**Requirement**: REQ-R03 — 3D model shows all components: bottom plate, cork gaskets,
PCB, switch plate, frame, keycaps, MCU, USB-C, battery, hinge, cables, fasteners.

**What previously failed**: Static analysis confirmed the code creates these layers, but
at runtime the cork gaskets, PCB, and switch plate were positioned at wrong Z or invisible,
making keycaps appear to float on the bottom plate.

**Verification procedure**:
1. Build 3D scene from example JSON
2. Traverse the entire Three.js scene graph
3. For each mesh/InstancedMesh: compute world position Z, classify into layer category
4. Layer categories (from render3d.js constants):
   - Bottom plate: Z ∈ [-0.5, 1.5]
   - Cork lower: Z ∈ [1.0, 2.0]
   - PCB: Z ∈ [1.5, 3.5]
   - Cork upper: Z ∈ [3.0, 4.0]
   - Switch plate: Z ∈ [3.5, 5.5]
   - Keycaps: Z ∈ [7.0, 15.0]
5. Assert: each category has ≥1 mesh
6. Assert: keycap InstancedMesh has ≥18 instances
7. Count total meshes and vertices for diagnostic

**Acceptance criteria**: All 5 layer categories have meshes. ≥18 keycap instances exist.

---

## R04 — Exploded view with distinct layers and labels [AUTO]

**Requirement**: REQ-R04 — Togglable exploded view with distinguishable layers and labels.

**What previously failed**: No distinct layer colors/materials visible. Cork and PCB layers
appeared same color as bottom plate.

**Verification procedure**:
1. Measure total Z-extent of scene in normal view
2. Call `applyExplodedView(true)`
3. Measure Z-extent again
4. Assert: exploded Z-extent ≥ 2× normal (layers separated)
5. Call `setLabelsVisible(true)`
6. Count visible Sprite objects
7. Assert: ≥5 labels visible
8. Group mesh materials by Z-band (10mm buckets)
9. Assert: ≥4 distinct Z-bands have meshes (layers are separable)
10. Restore normal view

**Acceptance criteria**: Exploded view separates layers by ≥2× Z. ≥5 labels. ≥4 material bands.

---

## R06 — Hinge articulates with fold angle [AUTO]

**Requirement**: REQ-R06 — Center joint/hinge visually articulates when fold angle changes.

**What previously failed**: Hinge pieces appeared floating/misaligned at fold angles,
suggesting the articulation math was wrong or components weren't following the fold.

**Verification procedure**:
1. Set fold=0°, record world positions of all hinge components (CylinderGeometry,
   SphereGeometry, BoxGeometry meshes that are direct scene children)
2. Set fold=45°, record same positions
3. Compare: at least some hinge components must have moved (delta > 0.5mm)
4. Check keyboard halves: record Group world positions at fold=0° and fold=45°
5. Assert: at least one half moved in X or Z (proving fold rotation occurred)
6. Restore fold=0°

**Acceptance criteria**: ≥1 hinge component moved >0.5mm. Keyboard halves articulated.

---

## R09 — Cables visible at fold=0 [AUTO]

**Requirement**: REQ-R09 — Cables connect keyboard edge attachment points.

**What previously failed**: Cables existed as TubeGeometry meshes but were invisible at
fold=0. The `cablesGroup.visible` was set to `false` because the visibility was linked to
fold angle check `angleDeg === 0`.

**Verification procedure**:
1. Set fold=0° (cables should be visible at flat position)
2. Call `setCablesVisible(true)` to force cables on
3. Traverse scene for TubeGeometry meshes
4. Assert: ≥2 TubeGeometry meshes found (top row + bottom row cables)
5. For each cable: check `mesh.visible` and `parent.visible`
6. Assert: ≥2 cables are visible
7. If cables invisible despite existing, report the visibility chain (which object is hidden)

**Acceptance criteria**: ≥2 TubeGeometry cable meshes visible at fold=0°.

---

## R12 — Key labels rendered on keycaps [AUTO]

**Requirement**: REQ-R12 — Key legends rendered as flat plane meshes on keycaps using
canvas textures with correct rotation.

**What previously failed**: No visible key labels — keycaps appeared as blank dark squares.
The label planes might exist in code but have wrong Z, wrong material, or are transparent.

**Verification procedure**:
1. Traverse scene for PlaneGeometry meshes (label implementation)
2. For each plane: check if it has a material with a `.map` texture
3. Check if the texture is a CanvasTexture (created from an offscreen canvas with letter text)
4. Count planes with valid canvas textures
5. Assert: ≥20 textured label planes (out of 36 total keys, some may be untextured)

**Acceptance criteria**: ≥20 PlaneGeometry meshes with CanvasTexture material maps.

---

## R14 — Fold direction is inward [AUTO]

**Requirement**: REQ-R14 — Fold direction matches REQ-F01c. Keycap surfaces face each
other when folded.

**What previously failed**: At fold angles, keycap surfaces appeared to face AWAY from
each other (outward fold instead of inward), indicating the rotation direction was inverted.

**Verification procedure**:
1. Set fold=160°
2. Identify the two keyboard half Groups (direct scene children with >2 children)
3. For each half: get world quaternion, apply to local +Z vector (keycap surface normal)
4. Determine which half is left (lower worldX) and right (higher worldX)
5. **Inward fold check**: left normal X > 0 (pointing right) AND right normal X < 0 (pointing left)
   → Keycap surfaces face each other ✓
6. **Outward fold check**: left normal X < 0 AND right normal X > 0
   → Keycap surfaces face away ✗
7. Compute dot product of normals (should be negative for inward — normals are antiparallel)
8. Restore fold=0°

**Acceptance criteria**: Left keycap normal has positive X component, right has negative.
Normals point toward each other (dot product < 0).

---

## S08 — Layer stack heights rendered [AUTO]

**Requirement**: REQ-S08 — Base layer stack: bottom plate 2.0mm + PCB 0.8mm + switch
plate 1.0mm = 3.8mm base.

**What previously failed**: Layer stack not rendered in 3D — no visible cork/PCB/switch
plate between bottom plate and keycaps.

**Verification procedure**:
1. Traverse scene, collect all mesh world Z-positions rounded to 0.1mm
2. For each expected layer, check if meshes exist within ±0.5mm tolerance:
   - Bottom plate at Z ≈ 0
   - Cork lower at Z ≈ 1.0
   - PCB at Z ≈ 1.5
   - Cork upper at Z ≈ 3.1
   - Switch plate at Z ≈ 3.6
3. Assert: all 5 layers found
4. Report actual Z positions and mesh counts per layer

**Acceptance criteria**: Meshes exist at all 5 expected Z positions (within 0.5mm tolerance).

---

## S09 — 4.8mm stack in 3D (not flat slab) [AUTO]

**Requirement**: REQ-S09 — Total stack ≤ 4.8mm represented in the 3D model.

**What previously failed**: Keyboard appeared as a single flat slab instead of multi-layer stack.

**Verification procedure**:
1. Compute bounding box of all board-level meshes (Z ∈ [-1, 6])
2. Measure total Z extent (maxZ - minZ)
3. Assert: Z extent ∈ [3.5, 7.0] mm (approximately 4.8mm expected)
4. A Z extent < 2mm indicates single-slab rendering (FAIL)

**Acceptance criteria**: Board Z extent is between 3.5mm and 7.0mm.

---

## DG-01 — Board outline is clean deliberate shape [AI]

**Requirement**: DG-01 — Board outline feels like a single deliberate shape, not an
artifact of the layout tool.

**What previously failed**: Board outline had visible dashed/dotted edge artifacts —
not a clean deliberate shape.

**Verification procedure**:
1. **[AUTO] Pre-check**: Count ExtrudeGeometry meshes at board level (Z < 2mm).
   Assert ≥2 (bottom plate + frame). Check total vertex count > 100 (smooth hull).
2. **[AI] Screenshot**: Position camera top-down, take screenshot of board outline.
   Save to `runtime-screenshots/dg01-board-outline.png`.
3. **[AI] Human review criteria**:
   - Are edges smooth and continuous (no staircase/dashed artifacts)?
   - Does the shape look deliberate (not an accident of convex hull)?
   - Are corners filleted (no sharp 90° angles)?
   - Is the thumb cluster connected to the main body smoothly?

**Acceptance criteria**: [AUTO] ≥2 outline meshes, >100 vertices.
[AI] Human confirms clean, deliberate outline in screenshot.

---

## Implementation

The verification script is `verify-runtime.js`. It:
1. Starts a local HTTP server on port 9876
2. Launches headless Chromium via Playwright
3. Loads wizard.html, verifies L01/L06/L10 (module initialization)
4. Injects example JSON data, navigates to page 2 (3D preview)
5. Waits for Three.js scene to build (up to 30s)
6. Queries scene graph for R03/R04/R06/R09/R12/R14/S08/S09
7. Takes screenshots for DG-01
8. Saves machine-readable results to `runtime-results.json`

### Running

```bash
cd /home/a/git/git/keyboard/wip
node verify-runtime.js
```

### Output files

| File | Purpose |
|------|---------|
| `runtime-results.json` | Machine-readable pass/fail per requirement |
| `runtime-screenshots/page1-toolbar.png` | Page 1 state after load |
| `runtime-screenshots/page2-3d-initial.png` | 3D scene initial state |
| `runtime-screenshots/page2-3d-final.png` | 3D scene after all checks |
| `runtime-screenshots/dg01-board-outline.png` | [AI] Top-down outline for review |
