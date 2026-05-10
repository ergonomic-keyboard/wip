# Requirement Verification Plan

All verification shall be automated and execute without user input. I will write scripts, take my own screenshots, simulate user taps, run headless browsers, parse outputs, and programmatically assert pass/fail. No human in the loop.

**Verification categories:**
- **CODE** — Static analysis of source code, config files, or generated outputs.
- **SCRIPT** — A Node.js/Python script that runs a computation and asserts numeric/structural results.
- **E2E** — Playwright or Selenium browser automation that drives the UI, captures screenshots, and asserts visual/functional outcomes.
- **BUILD** — Run `generate.sh` or `ergogen` CLI and verify outputs exist and are structurally correct.
- **3D** — Headless Three.js render to canvas/PNG, pixel-level or geometry-level assertions.
- **DOC** — Verify a document exists, contains required sections, and passes structural checks.

**Tools available:**
- `node test-headless.js` — ergogen pipeline verification
- `node validate-stages.js` — stage 1 vs stage 2 comparison
- `python3 control.py` — Selenium browser automation with screenshot capture
- Playwright (`ergopad/e2e/`) — E2E browser tests for ergopad
- Ergogen test suite (`ergogen/test/`) — Mocha with 100% coverage
- `generate.sh` — Full build pipeline
- `convert.py` — JSON-to-YAML conversion
- Node.js with ergogen.js library — headless ergogen processing
- Python for numerical assertions, JSON parsing, geometry math

---

## 1. Layout & Input

### REQ-L01 — Passhutk ergopad captures taps → JSON
**Type:** E2E
**Plan:** Playwright test: launch ergopad app, programmatically click canvas at known (x,y) coordinates for each column (pinky, ring, middle, index, inner, thumb — at least 4 taps each). Trigger export. Parse the downloaded/clipboard JSON. Assert: (a) JSON has `positions` object with all 6 column keys, (b) each column array has length ≥ 4, (c) each entry has `x` and `y` numeric fields, (d) coordinates are within canvas bounds.

### REQ-L02 — Computed switch positions → config.yaml via converter
**Type:** SCRIPT
**Plan:** For each of the 9 example JSONs in `wip/examples/`: (a) Run `convert.py` to produce `config.yaml`. (b) Verify config.yaml is valid YAML. (c) Parse and assert it contains `zones` with columns matching input. (d) Verify the converter reads from computed switch positions (item b in JSON), not raw taps — inject a JSON where raw taps differ from computed positions; assert config.yaml matches computed positions, not taps.

### REQ-L03a — Fitting algorithm determinism
**Type:** SCRIPT
**Plan:** Write `test-determinism.js`: For each example JSON, run the fitting algorithm 100 times with identical inputs (same taps, PPM, algorithm). Capture all 100 result sets. Assert bit-identical output across all runs (use `JSON.stringify` comparison — zero tolerance). Test with all 3 thumb modes.

### REQ-L03b — Ergogen output within 0.05mm / 0.05° of computed positions
**Type:** SCRIPT
**Plan:** Extend `test-headless.js`: For each example JSON, (a) extract computed switch positions from JSON. (b) Run ergopadToErgogen → config.yaml → ergogen.process(). (c) Extract ergogen output points. (d) For every key, compute Euclidean distance between computed and ergogen positions; assert < 0.05 mm. (e) Compute rotation delta; assert < 0.05°. (f) Report per-key deltas in a table. Fail hard on any exceedance.

### REQ-L04 — Each column has exactly 3 keys, ≥3 taps
**Type:** SCRIPT + E2E
**Plan (SCRIPT):** Parse every example JSON — assert each column has ≥ 3 entries in raw taps. After fitting, assert exactly 3 computed switch positions per column.
**Plan (E2E):** Playwright: tap only 2 times in one column, then try to proceed. Assert system prevents progression or shows error. Tap 3 times — assert system accepts. Tap 20 times — assert system still produces exactly 3 switches.

### REQ-L04a — 36 keys total (6 columns × 3 keys × 2 halves)
**Type:** SCRIPT + BUILD
**Plan:** After running ergogen on any config.yaml: count total points in ergogen output (including mirror). Assert exactly 36. Also verify in BOM (when generated) that switch count = 36, keycap count = 36.

### REQ-L05 — Keys in a column are colinear and perpendicular to fitted line
**Type:** SCRIPT
**Plan:** For each matrix column in each example JSON: (a) Compute fitted line via regression. (b) For each of the 3 switch centers, compute signed distance from the fitted line; assert < 1e-6 mm (they should be on the line). (c) Compute each switch rectangle's rotation; assert all 3 are identical (within 1e-6°). (d) Assert rotation = `atan(slope) + PI/2` (perpendicular to line).

### REQ-L06 — Only thumb cluster has independent splay
**Type:** CODE
**Plan:** Parse generated config.yaml. For every non-thumb column (`pinky`, `ring`, `middle`, `index`, `inner`), assert `splay` is either absent or 0. For the thumb zone, assert splay may be nonzero (for ROTATED mode). Verify this across all 3 thumb modes.

### REQ-L07 — Three thumb modes: STRAIGHT, ROTATED, ERGOGEN
**Type:** SCRIPT
**Plan:** Write `test-thumb-modes.js`: For one example JSON with thumb taps, run the fitting algorithm in each of the 3 modes:
- **STRAIGHT:** Assert all 3 thumb keys are colinear (max deviation from regression line < 1e-6 mm). Assert all rotations identical. Assert generated config.yaml has splay=0 for thumb zone.
- **ROTATED:** Assert all 3 thumb keys lie on a circle (fit circle, assert max radial error < 1e-6 mm). Assert each key rotation = tangent to arc. Assert config.yaml has uniform nonzero splay.
- **ERGOGEN:** Provide known ergogen params, assert config.yaml passes them through verbatim (character-level match of splay/spread/origin values).

### REQ-L07a — Thumb mode + params stored in export JSON
**Type:** SCRIPT
**Plan:** Run export in each thumb mode. Parse JSON. Assert: (a) field `thumbMode` exists and equals `STRAIGHT`/`ROTATED`/`ERGOGEN`. (b) For STRAIGHT: `thumbParams.lineAngle` present. (c) For ROTATED: `thumbParams.center`, `thumbParams.radius`, `thumbParams.angularOffsets` present. (d) For ERGOGEN: `thumbParams.spread`, `thumbParams.splay`, `thumbParams.origin` arrays present.

### REQ-L07b — Switching thumb mode redraws immediately, preserves taps
**Type:** E2E
**Plan:** Playwright: (a) Tap 5 thumb positions. (b) Screenshot canvas (state A). (c) Switch to ROTATED mode. (d) Screenshot canvas (state B). (e) Assert state A ≠ state B (pixel diff > threshold — keys moved). (f) Read stored thumb taps — assert count still 5 (preserved). (g) Switch back to STRAIGHT. (h) Screenshot canvas (state C). (i) Assert state C = state A (same positions restored).

### REQ-L08 — Tune Scale calibration modal
**Type:** E2E
**Plan:** Playwright: (a) Open Tune Scale modal. (b) Assert reference line is visible. (c) Enter 100 mm. (d) Close modal. (e) Read `localStorage` for calibration value; assert it's set. (f) Reload page. (g) Read `localStorage` again; assert value persists. (h) Compute expected PPM = CSS width of reference line / 100; assert stored PPM matches.

### REQ-L09 — ergopadToErgogen converter reconstructs positions within tolerance
**Type:** SCRIPT
**Plan:** This is directly tested by REQ-L03b verification. Additionally: write a test that specifically validates the cumulative rotation stack inverse-solve by constructing a config with known splay values, running ergogen forward, then running the inverse solver backward, and asserting round-trip error < 0.05 mm.

### REQ-L10 — JSON export/import completeness
**Type:** SCRIPT
**Plan:** (a) Export JSON from a known state. Parse and assert presence of all required fields: `positions[column][].{x,y}` (raw taps), `computedSwitches[column][].{center:{x,y}, rotation, size:{w,h}}`, `fittingAlgorithm[column]`, `thumbMode`, `thumbParams`, `calibratedPPM`, `canvasWidth`, `canvasHeight`. (b) Modify `canvasWidth` in the JSON (simulate different screen). Reload. Assert raw taps are scaled correctly (proportional to canvas ratio). Assert recomputed switches match stored switches within 1e-6 mm.

### REQ-L11 — Zoom in/out with keyboard shortcuts
**Type:** E2E
**Plan:** Playwright: (a) Record initial switch visual size on canvas. (b) Press zoom-in shortcut. (c) Screenshot. Assert switches are visually larger (bounding box comparison). (d) Press zoom-out shortcut. Assert switches return to original size. (e) Verify the shortcuts don't trigger browser default actions (no page zoom, no find dialog). (f) If Tune Scale was set, assert calibration value changed proportionally.

---

## 2. Validation

### REQ-V01a — Boundary 1: taps → computed switches determinism on reload
**Type:** SCRIPT
**Plan:** For each example JSON: (a) Load JSON, extract stored computed positions. (b) Rerun fitting algorithm from stored raw taps + PPM + algorithm. (c) Compare recomputed vs stored. Assert max delta < 1e-6 mm for position, < 1e-6° for rotation. If any delta exceeds this, report the key and deltas, and fail.

### REQ-V01b — Boundary 2: computed switches → ergogen within 0.05mm/0.05°
**Type:** SCRIPT
**Plan:** Same as REQ-L03b. Run `test-headless.js` for all example JSONs. Assert per-key position error < 0.05 mm, rotation error < 0.05°. Generate a CSV report of all deltas.

### REQ-V02 — Relative key arrangement preserved
**Type:** SCRIPT
**Plan:** For each pair of adjacent keys (within column: k1→k2→k3; between columns: closest pairs): compute center-to-center distance and direction vector from computed positions. Compute same from ergogen output. Assert distance deltas < 0.1 mm and direction angle deltas < 0.1°. Detect if any key pair has swapped order (sign of direction vector flipped).

### REQ-V03 — No overlapping switches
**Type:** SCRIPT
**Plan:** For every pair of keys (all 18 per half, 153 pairs): compute center-to-center distance. Assert distance > Cherry ULP switch housing width (look up from datasheet — approximately 13.8 mm). Run this on both computed positions and ergogen output. Fail if any pair overlaps.

### REQ-V04 — Validation recomputes on every tap add/remove
**Type:** E2E
**Plan:** Playwright: (a) Add a tap. Assert validation ran (check for validation result element or console log). (b) Add more taps until 3 per column. Assert validation ran each time (count validation invocations via console.log interception). (c) Remove a tap. Assert validation ran again. Verify no "navigate to separate page" step is required.

### REQ-V05 — Validation errors displayed on canvas
**Type:** E2E
**Plan:** Playwright: (a) Deliberately create an overlapping switch layout (tap two columns at nearly the same position). (b) Screenshot canvas. (c) Assert red overlay is visible (pixel color sampling at known key positions — look for red channel > 200). (d) Assert summary message element exists below toolbar, contains error text. (e) Fix the overlap (move taps apart). (f) Assert green indicators appear, error message clears.

### REQ-V06 — Next button disabled on validation error
**Type:** E2E
**Plan:** Playwright: (a) Create an invalid layout (overlapping switches). (b) Assert Next button is disabled (`button.disabled === true` or CSS `pointer-events: none`). (c) Assert error is "displayed prominently" (element has font-size ≥ 14px, color is red-ish). (d) Fix the layout. (e) Assert Next button becomes enabled.

---

## 3. Hardware — Switches & Keys

### REQ-H01 — Cherry MX ULP switches
**Type:** CODE + BUILD
**Plan:** (a) Grep ergogen footprint files for `cherry_ulp` usage. Assert config.yaml specifies this footprint. (b) Verify the KiCad PCB output contains Cherry ULP footprints (parse .kicad_pcb, search for footprint name). (c) Verify BOM lists "Cherry MX ULP" with correct quantity (36).

### REQ-H02 — No soldering except ULP switches
**Type:** CODE + DOC
**Plan:** (a) Parse BOM. For each electrical component, check the assembly method field. Assert only "Cherry MX ULP" has "solder" method. MCU, battery connector, USB-C shall list "hot-swap", "press-fit", "pin header", or "socket". (b) Parse `grandma_builder.md` — assert no soldering steps except for ULP switch attachment.

### REQ-H03 — Keycap legends displayed
**Type:** 3D + DOC
**Plan:** (a) In render3d.js output, for each keycap mesh: assert it has a child plane mesh with a canvas texture. (b) Verify the texture contains non-empty text (render to image, assert pixel variance > threshold — not blank). (c) Verify BOM includes "keycap legend set" or "sticker overlay sheet" as a line item.

---

## 4. Hardware — Structure

### REQ-S01 — Two separate halves
**Type:** BUILD + 3D
**Plan:** (a) Run ergogen. Assert output contains a mirror operation (or two separate zone definitions) producing 2 halves. (b) In 3D render, assert there are exactly 2 top-level keyboard body meshes. (c) At fold angle 0°, butterfly 0°: assert the two body meshes do not overlap (bounding box intersection test).

### REQ-S02 — Smoothed board outline
**Type:** BUILD + CODE
**Plan:** (a) Run ergogen to generate outline SVG/DXF. (b) Parse the outline path. (c) Assert: no 90° staircase corners remain (all corner angles > 90° or filleted). (d) Measure index side straightness (fit line to index-side points, assert max deviation < 0.5 mm). (e) Measure top edge curvature (fit arc, assert it's a single continuous arc). (f) Measure thumb cluster fillet radius; assert ≥ 8 mm. (g) Measure overall perimeter fillet; assert ≥ 8 mm.

### REQ-S03 — Thumb cluster connected to main body
**Type:** BUILD + CODE
**Plan:** (a) Parse board outline polygon. (b) Assert it is a single connected polygon (no separate islands). The thumb cluster outline must be reachable from the main matrix outline without crossing empty space. (c) In 3D render, assert no floating meshes separated by gaps from the main body.

### REQ-S04 — 2mm bamboo plywood, two-part frame
**Type:** CODE + 3D
**Plan:** (a) In assembly.scad or render3d.js, assert frame thickness = 2 mm. (b) Assert there are exactly 2 frame pieces (bottom backbone + top bezel) in the 3D model. (c) In exploded view: count frame layers — assert 2.

### REQ-S05 — Frame wall width ≥ 4mm
**Type:** BUILD + SCRIPT
**Plan:** (a) Parse board outline (PCB/plate boundary). Parse frame outline. (b) For every point on the PCB boundary, compute minimum distance to the frame outer boundary. Assert all distances ≥ 4.0 mm. Report the minimum found.

### REQ-S06 — M2 heat-set inserts + M2 countersunk bolts
**Type:** CODE + DOC
**Plan:** (a) Parse BOM. Assert entries for "M2 heat-set brass threaded insert" and "M2 countersunk flat-head bolt" exist, with matching quantities. (b) Verify assembly.scad/render3d.js models the correct fastener types (search for "M2", "countersunk", "heat-set" in source). (c) In 3D render, assert bolt head sits flush (bolt top surface Y ≤ frame top surface Y, within 0.1 mm).

### REQ-S07 — ≥7 mounting points per half
**Type:** BUILD + CODE
**Plan:** (a) Parse mounting point positions from assembly.scad or config. Count per half. Assert ≥ 7. (b) Assert at least one near the thumb bridge area, one near middle column center, one near inner-bottom. Compute distances from these regions to nearest mounting point; assert < 20 mm.

### REQ-S07a — Bolt-through-stack clamping path
**Type:** CODE + 3D
**Plan:** (a) For each mounting point, verify all layers (top bezel, switch plate, cork, PCB, cork, bottom backbone) have a clearance hole defined at that position. Parse each layer's DXF/SVG for hole presence. (b) In exploded 3D view, assert bolt mesh passes through all layers visually (raytrace from bolt head position downward, assert intersection with each layer).

### REQ-S08 — Layer stack heights
**Type:** CODE + SCRIPT
**Plan:** (a) Parse config/assembly definitions. Assert bottom plate = 2.0 mm, PCB = 0.8 mm, switch plate = 1.0 mm. (b) Sum = 3.8 mm; assert this. (c) Cross-reference Cherry ULP datasheet dimensions (fetch from `keeb.supply` or local copy) — verify switch mounting height is compatible with 1.0 mm plate + 0.8 mm PCB.

### REQ-S08a — Cork gaskets 0.5mm each, 1.0mm total
**Type:** CODE + 3D
**Plan:** (a) Assert 2 cork layers in assembly definition, each 0.5 mm. (b) In 3D model, measure Y-distance between bottom plate top surface and PCB bottom surface; assert = 0.5 mm. Same between PCB top and switch plate bottom. (c) Total cork = 1.0 mm.

### REQ-S09 — Total stack ≤ 4.8mm
**Type:** SCRIPT
**Plan:** Sum all layer heights from REQ-S08 + REQ-S08a: 2.0 + 0.5 + 0.8 + 0.5 + 1.0 = 4.8 mm. Assert sum ≤ 4.8 mm. In 3D model, measure total Y-extent of the stack (excluding bezel and keycaps); assert ≤ 4.8 mm.

### REQ-S10 — Battery area designated, no width increase
**Type:** CODE + BUILD
**Plan:** (a) Parse PCB layout. Assert a battery footprint/zone exists. (b) Compare board outline width with and without battery zone — assert battery does not increase board width. (c) If battery height exceeds stack clearance, verify bottom plate has a cutout/recess at that location (parse DXF for pocket/recess at battery coordinates).

### REQ-S11 — Battery connector footprint on PCB
**Type:** BUILD
**Plan:** Parse KiCad PCB file. Search for battery connector footprint (e.g., `JST_SH_2pin` or similar). Assert it exists. Assert its position is within the designated battery area.

### REQ-S12 — Expanded key padding for smooth perimeter
**Type:** BUILD + SCRIPT
**Plan:** (a) Verify config.yaml uses `px + 4` for board outline padding and `px + 8` for frame padding (grep config for these values). (b) Parse generated outline SVG. Assert the perimeter is smooth (no internal concavities deeper than 1 mm) and continuous around all keys including thumb.

---

## 5. Hardware — Hinge & Folding

### REQ-F01 — Center mount, metal, ≤50g
**Type:** DOC + CODE
**Plan:** (a) In BOM, verify hinge mechanism is listed with material = "metal" (steel/brass/aluminum). (b) Verify weight specification ≤ 50 g in BOM. (c) In 3D render, assert hinge position is at center edge (X ≈ 0 between the two halves). Compute hinge mesh center; assert X is within 5 mm of keyboard center.

### REQ-F01a — Two axes: fold 0-90°, butterfly ±45°
**Type:** 3D + SCRIPT
**Plan:** (a) In 3D render: set fold slider to 0°, 45°, 90° — screenshot each. Assert left/right half angles match slider value (compute mesh normals or bounding box angles). (b) Set butterfly slider to -45°, 0°, +45° — assert halves yaw correctly. (c) Verify fold and butterfly are independent: change fold at fixed butterfly, assert butterfly angle unchanged (compute Y-rotation of each half mesh).

### REQ-F01b — Butterfly limited by collision at fold angles
**Type:** 3D
**Plan:** (a) For fold = 0°, 30°, 60°, 90°: programmatically sweep butterfly from 0° to 45° in 1° steps. At each step, run bounding-box collision detection between left and right half meshes (including thumb clusters and hinge). Record the maximum butterfly angle before collision. (b) Assert the UI slider clamps to this maximum. (c) Verify no mesh interpenetration at any displayed angle.

### REQ-F01c — Fold-to-close, inward fold, magnets
**Type:** 3D + DOC
**Plan:** (a) Set fold to 180° in 3D render. Assert keycap surfaces face each other (compute keycap mesh normals; assert they point toward each other). (b) If disconnect animation exists: assert it triggers between 90° and 180°. Screenshot the disconnect state. (c) In BOM: assert magnets are listed (quantity 2–3). (d) In 3D render at 180°: assert magnet meshes are positioned at frame edges where they'd hold the halves closed.

### REQ-F01d — Cable turnbuckles primary, optional friction lock
**Type:** DOC + CODE
**Plan:** (a) Verify cable turnbuckle is present in BOM and 3D model. (b) Verify the requirement text does not mandate a friction lock for desk use. (c) If a friction lock or thumb nut exists in the model, verify it's labeled "optional" in BOM/docs.

### REQ-F05 — Two horizontal cables, top row and bottom row
**Type:** 3D + CODE
**Plan:** (a) In 3D render, assert exactly 2 cable meshes connecting the halves. (b) Measure Z-positions of cables; assert one is near Q-to-P row (Z ≈ top row center) and one near Z-to-M row (Z ≈ bottom row center). (c) Assert cables are on the bottom plate (Y ≤ bottom plate Y).

### REQ-F06 — Quick-release clevis pins with ball detent
**Type:** DOC + 3D
**Plan:** (a) BOM: assert "quick-release clevis pin" and "spring-loaded ball detent" listed. (b) 3D render: assert clevis pin meshes exist at cable endpoints. (c) Verify brackets are "recessed" — assert clevis bracket mesh Y does not protrude above frame surface.

### REQ-F07 — Clevis pins on backside when folded closed
**Type:** 3D
**Plan:** At fold = 180° (closed): compute world positions of clevis pin meshes. Assert they are on the backside (positive Y, away from keycap surface), not at the outer edge. The clevis pins should be between the two folded halves or on the flat back surface.

### REQ-F08 — Cables wrap around closed keyboard
**Type:** 3D
**Plan:** At fold = 180°: assert cable meshes are repositioned/animated to wrap around the closed keyboard form. Assert elastic band meshes are visible. This may require screenshot comparison between fold = 0° (cables straight) and fold = 180° (cables wrapped).

### REQ-F09 — Turnbuckles for adjustable tension/length
**Type:** 3D + DOC
**Plan:** (a) Assert turnbuckle meshes exist on each cable (cylindrical body mesh between two rod segments). (b) BOM: assert "turnbuckle cable assembly" listed. (c) 3D render: vary fold angle — verify cables visually change length proportionally (screenshot at fold 0° and 60°, measure cable mesh length difference).

---

## 6. Mechanism A — Turnbuckle + Hirth (from locking_mechanism_requirements.md)

### REQ-MA01 through REQ-MA09
**Type:** 3D + DOC + CODE
**Plan:** These are verified as a group through the 3D render and BOM:
- **MA01 (angled rods):** Assert 2 rod meshes exist, each ~25mm, angled ~15° above horizontal. Measure rod mesh angle from horizontal; assert 12–18°.
- **MA02 (center eye + pin):** Assert torus mesh at center. Assert cylindrical pin mesh through it, oriented along Z.
- **MA03 (turnbuckle rod):** Assert green rod mesh below hinge, ~6–10mm below center eye Y.
- **MA04 (ball joints):** Assert sphere meshes at turnbuckle attachment ends.
- **MA05 (quick-release magnet):** Assert blue/cylindrical mesh at center eye area. BOM: "neodymium magnet" listed.
- **MA06 (Hirth discs flat on back):** Assert 2 disc meshes, one on each half's bottom face. Assert disc normal points toward the opposing half (not up/down). Measure disc orientation; assert within 5° of horizontal.
- **MA07 (60–80mm, 72 or 120 teeth):** Assert disc mesh diameter 60–80mm. BOM: "Hirth coupling, 72-tooth 60mm" or "120-tooth 80mm" listed. Assert BOM has supplier link (TEDISA or TAC Rockford).
- **MA08 (butterfly nut / cam lever):** Assert nut or lever mesh exists near disc center. Assert it's operable with one hand (DOC check in builder guide).
- **MA09 (teeth self-align):** This is a physical property of Hirth joints — verified by DOC reference to Hirth coupling specification.

---

## 7. Electronics & Connectivity

### REQ-E01 — nice!nano MCU
**Type:** CODE + BUILD
**Plan:** (a) Parse config.yaml or PCB footprints. Assert nice!nano footprint is used (search for `promicro` compatible or `nice_nano` in footprint files). (b) BOM: assert "nice!nano" listed, quantity 2. (c) Verify PCB has correct pin count and spacing for nice!nano.

### REQ-E02 — Connectivity modes (BT + USB-C)
**Type:** DOC + CODE
**Plan:** (a) Verify ZMK firmware config supports all 4 modes listed. Parse ZMK .conf or .keymap files for Bluetooth and USB settings. (b) Assert firmware config has BT disable option. (c) This is primarily a firmware verification — write a script that parses the ZMK devicetree config and asserts: BT enabled, USB enabled, split-keyboard role assignment, BT disable flag present.

### REQ-E03 — One USB-C port per half
**Type:** BUILD + 3D
**Plan:** (a) Parse PCB. Assert USB-C connector footprint exists, one per half. (b) 3D render: assert USB-C connector mesh exists on each half (chrome/metallic material, positioned at board edge). Count = 2 total.

### REQ-E04 — 301230 LiPo batteries, visible in assembly
**Type:** DOC + 3D
**Plan:** (a) BOM: assert "301230 LiPo battery" listed, quantity 2. (b) In assembly.scad or 3D render: assert battery mesh exists, one per half. Assert battery dimensions match 301230 form factor (3.0 × 12 × 30 mm).

### REQ-E05 — Working firmware for nice!nano
**Type:** CODE + DOC
**Plan:** (a) Assert ZMK config files exist (`.keymap`, `.conf`, `build.yaml`). (b) If possible, run `west build` in a ZMK Docker container to verify firmware compiles. If Docker unavailable, at minimum assert the config files parse without errors by running a YAML/devicetree linter. (c) Verify keymap has 36 keys mapped.

---

## 8. Bill of Materials & Sourcing

### REQ-B01 — Complete BOM exists
**Type:** DOC
**Plan:** Assert file `BOM.md` (or `bom.csv`) exists. Parse it. Assert it has at least 15 unique line items (minimum for this keyboard: switches, keycaps, MCUs, batteries, PCBs, plates, frame pieces, cork, bolts, inserts, hinge, magnets, cables, turnbuckles, clevis pins, elastic bands, USB-C connectors, Hirth discs).

### REQ-B02 — Each BOM item has supplier link + price
**Type:** DOC
**Plan:** Parse BOM. For each line item: assert a URL is present (regex match `https?://`). Assert a price field exists and is a positive number. Flag any item missing either.

### REQ-B03 — BOM includes all specified items
**Type:** DOC
**Plan:** Define a checklist of required items from REQ-B03 text. For each item, fuzzy-match against BOM entries (case-insensitive substring search). Assert all items are found: cork, bamboo, M2 inserts, M2 bolts, clevis pins, turnbuckles, elastic bands, hinge, magnets, Cherry ULP, keycaps/stickers, nice!nano, 301230 LiPo, USB-C, Hirth coupling discs. Report missing items.

---

## 9. Assembly

### REQ-A01 — Bolts + inserts documented, no screws/nuts
**Type:** DOC
**Plan:** (a) Parse BOM. Assert "M2 bolt" and "M2 heat-set insert" present. Assert no entries containing "screw" or "nut" (except "butterfly nut" if used in hinge — which is specified in mechanism A). (b) Parse assembly documentation. Assert bolt positions are listed with coordinates or diagram references.

### REQ-A02 — CNC/laser-cut files generated
**Type:** BUILD
**Plan:** After running `generate.sh`: assert output directory contains DXF or SVG files for: bottom plate, top bezel, switch plate (at minimum 3 files per half = 6 total). Verify files are valid DXF/SVG (parse headers, assert non-empty geometry).

### REQ-A03 — grandma_builder.md exists and is sequential
**Type:** DOC
**Plan:** Assert `grandma_builder.md` exists. Parse it. Assert it contains numbered steps. Assert steps are sequential (step N references something done in step N-1 or earlier, not later). Assert no jargon without explanation (check for technical terms — if found, assert they're accompanied by a parenthetical or footnote explanation). Minimum 10 steps for a full assembly.

---

## 10. 3D Render & Visualization

### REQ-R01 — Interactive 3D viewer with orbit/zoom/pan + legend
**Type:** E2E
**Plan:** Selenium/Playwright: (a) Load wizard stage 2 (3D view). (b) Assert WebGL canvas is present and rendering (non-black pixels exist). (c) Simulate mouse drag — screenshot before and after, assert camera angle changed (pixel diff > threshold). (d) Simulate scroll — assert zoom changed. (e) Simulate right-drag — assert pan occurred. (f) Assert top-right legend element exists with keyboard shortcut text.

### REQ-R02 — 3D model updates on config change
**Type:** E2E
**Plan:** (a) Load 3D view with config A. Screenshot. (b) Modify config (change a column spread value). Trigger regeneration. (c) Screenshot again. Assert pixel diff > threshold (model changed). (d) Verify no manual page reload was needed.

### REQ-R03 — All components visible
**Type:** 3D
**Plan:** In headless Three.js render or Selenium screenshot: programmatically check scene graph for meshes named/tagged as: bottom_plate, cork_gasket (×2), pcb, switch_plate, frame, keycap (×18 per half), mcu, usb_c, battery, hinge, cable (×2), fastener (×7+). Assert all are present. Take exploded-view screenshot — assert all components are separately visible.

### REQ-R04 — Togglable exploded view with labels
**Type:** E2E
**Plan:** (a) Assert exploded view toggle button/checkbox exists. (b) Click it. Screenshot. Assert layers are vertically separated (compute Y-extent of scene; exploded should be > 3× non-exploded). (c) Assert label elements or text sprites are visible on each layer. (d) Assert each layer has distinct material/color (pixel sample each layer region — assert different colors).

### REQ-R05 — Keycap press animation on click
**Type:** E2E
**Plan:** Playwright: (a) Identify a keycap in 3D view. (b) Record its Y position (via scene graph query or pixel position). (c) Click it. (d) Record Y position during animation (requestAnimationFrame hook or rapid screenshots). Assert Y decreased (key pressed down). (e) After animation completes, assert Y returned to original.

### REQ-R06 — Hinge articulates with fold angle
**Type:** 3D
**Plan:** (a) For fold angles 0°, 30°, 60°, 90°: read hinge sub-component world transforms. Assert each component (rods, eye, turnbuckle, Hirth discs) has rotated/translated consistent with the fold angle. (b) Assert hinge sub-components match Mechanism A geometry (angled rods, center eye, turnbuckle, Hirth discs on back).

### REQ-R07 — Butterfly slider constrained by collision
**Type:** 3D + SCRIPT
**Plan:** (a) At fold = 0°: sweep butterfly 0→45° in 1° steps, run collision check at each. Record max valid angle. Assert UI slider max = this value. (b) At fold = 60°: repeat. Assert max butterfly is smaller (geometry is tighter). (c) Set butterfly beyond the computed max. Assert slider snaps back to max valid angle.

### REQ-R08 — Fold slider 0–180°, disconnect animation
**Type:** 3D + E2E
**Plan:** (a) Drag fold slider from 0° to 180°. Assert both halves remain visible at all angles (no mesh visibility = false). (b) Assert no ground-plane clipping (all mesh vertices Y ≥ 0). (c) Assert no visual artifacts (screenshot at each 10° step — no NaN positions, no exploded geometry). (d) At disconnect angle (~100–110°): assert magnetic breakaway animation plays (poles separate, gap appears between hinge components). (e) Assert pivot point = hinge center (both halves rotate around the same axis).

### REQ-R09 — Cables animate on fold
**Type:** 3D
**Plan:** (a) At fold 0°: cables are horizontal, connected to keyboard edges. Screenshot. (b) At fold 90°: cables have moved/shortened. Assert cable mesh vertex positions changed. (c) At fold > disconnect angle: cables release from clevis pins. Assert cable endpoint moved away from the clevis position. (d) At fold 180°: cables wrap around. Assert cable follows the folded keyboard perimeter.

### REQ-R10 — USB-C ports rendered as chrome/metallic
**Type:** 3D
**Plan:** (a) Find USB-C connector meshes in scene graph. Assert material has metalness > 0.5 and roughness < 0.4. (b) Assert mesh has a dark opening (inner face with dark material or recessed geometry). (c) Screenshot at close zoom — assert connector is identifiable as USB-C (rectangular opening, approximate 8.3 × 2.5 mm proportions).

### REQ-R11 — Keycap/switch positions match switch plate cutouts
**Type:** 3D + SCRIPT
**Plan:** (a) Extract keycap mesh positions from 3D scene. (b) Extract switch plate cutout positions from config.yaml (ergogen output). (c) For each key, compute distance between keycap center and cutout center. Assert < 0.1 mm. (d) Verify offset is computed from config.yaml directly — grep source code for SVG-based offset computation; assert it's absent.

### REQ-R12 — Key legends as canvas texture planes
**Type:** 3D + CODE
**Plan:** (a) For each keycap mesh, assert a child plane mesh exists. (b) Assert the plane has a CanvasTexture material (check material.map instanceof CanvasTexture or equivalent). (c) Assert rotation of the plane matches key orientation (compare plane mesh rotation to keycap rotation; delta < 0.5°).

### REQ-R13 — Bamboo PBR material with grain
**Type:** 3D
**Plan:** (a) Find frame/plate meshes. Assert they have a normalMap assigned (material.normalMap !== null). (b) Assert roughness is in wood range (0.4–0.8). Assert metalness is near 0 (< 0.1). (c) Render normalMap to image — assert it has texture detail (image variance > threshold, not a flat color). (d) Check for grain pattern: compute horizontal vs vertical frequency content of normalMap; assert directional bias (grain lines run in one direction).

### REQ-R14 — Inward fold direction
**Type:** 3D
**Plan:** At fold = 180°: for each keycap mesh, compute its face normal. Assert normals point toward the opposing half (inward), not outward. Keycap surfaces face each other.

### REQ-R15 — No clipping at any fold angle
**Type:** 3D
**Plan:** For fold = 0° to 180° in 5° steps: render frame, extract all mesh vertices in world space. Assert no vertex has Y < -0.5 mm (below ground plane accounting for floating point). Assert no mesh intersects the ground plane or the opposing half's mesh (except at the hinge center). 36 screenshots for visual verification archive.

### REQ-R16 — Thumb cluster visually connected
**Type:** 3D
**Plan:** (a) Extract frame outline mesh vertices. Assert the thumb cluster region is connected to the main body region (no gap > 1 mm between nearest vertices). (b) Screenshot top-down view — assert no visible gap between thumb and main body.

---

## 11. Stage Fidelity

### REQ-SF01 — Computed positions reproduced in ergogen + 3D within tolerance
**Type:** SCRIPT
**Plan:** Run the full pipeline: JSON → fitting algorithm → computed positions → ergopadToErgogen → config.yaml → ergogen → output points → 3D render positions. At each stage, extract positions and compare to computed positions from the JSON. Assert all deltas < 0.05 mm / 0.05°. This subsumes V01a and V01b. Generate a full traceability matrix (key ID × stage × x, y, rotation, delta).

### REQ-SF02 — Canvas switch rectangles perpendicular to regression line
**Type:** E2E + SCRIPT
**Plan:** (a) In Playwright: inject known taps. Screenshot stage 1 canvas. (b) For each column: compute the regression line angle. (c) Measure the drawn rectangle rotation on canvas (either via pixel analysis or by intercepting drawCanvas calls). (d) Assert rotation = `PI/2 + atan(slope)` applied as `ctx.rotate(-rad)`. Tolerance: < 0.1°.

### REQ-SF03 — More taps spread switches outward via CoG
**Type:** E2E
**Plan:** (a) Inject 3 taps in a column. Record the 3 switch Y-positions (projected along column axis). Compute span = max - min. (b) Inject 10 more taps (same column, spread over a wider range). Record new switch positions. Compute new span. (c) Assert new span > old span (switches spread outward). (d) Verify the drawCanvas algorithm was not modified — hash the drawCanvas function source and compare to a known-good hash.

---

## 12. Design Guidelines (Subjective)

These are explicitly non-verifiable in a pass/fail sense. I will produce automated quality assessments that flag potential issues but do not block.

### DG-01 — Board outline feels deliberate
**Assessment:** Render top-down SVG of outline. Compute curvature at every point. Flag any curvature discontinuities (sharp corners) or concavities as "review needed."

### DG-02 — Professional rendering quality
**Assessment:** Screenshot 3D render. Run image quality metrics: (a) Assert shadow softness (no hard-edged shadows). (b) Assert anti-aliasing (edge smoothness via Sobel filter). (c) Assert tone mapping is active (check renderer.toneMapping !== NoToneMapping). (d) Assert environment map or reflections present on metallic parts (specular highlight detection).

### DG-03 — Bamboo recognizable
**Assessment:** Crop a frame section from screenshot. Compute color histogram. Assert warm tones dominant (hue 20–50°). Assert texture variance > threshold (not flat).

### DG-04 — Shape refinement pass
**Assessment:** After all REQ-S and REQ-R pass: run outline smoothness check. Flag any sharp transitions or asymmetries that appear unintentional.

### DG-05 — Minimal thickness
**Assessment:** Already verified by REQ-S09 (≤ 4.8 mm). Flag if any area is thicker than necessary.

### DG-06 — Cable QR zero-thought operation
**Assessment:** Count steps in builder guide related to cable attach/detach. Flag if > 2 steps per cable.

### DG-07 — Compact folded package
**Assessment:** At fold = 180°: compute bounding box of entire folded assembly. Assert volume < 2× single-half volume.

### DG-08 — Dampened acoustics
**Assessment:** Verify cork gaskets are present (REQ-S08a). Cork provides damping. Flag if any air gap > 1 mm exists in the stack.

### DG-09 — Natural bamboo appearance
**Assessment:** Same as DG-03. Additionally check normalMap has wood grain pattern.

---

## Execution Priority

**Phase 1 — Foundation (software pipeline):**
L01, L02, L03a, L03b, L04, L04a, L05, L09, L10, V01a, V01b, V02, V03, SF01

**Phase 2 — UI/UX verification:**
L06, L07, L07a, L07b, L08, L11, V04, V05, V06, SF02, SF03

**Phase 3 — 3D render verification:**
R01–R16

**Phase 4 — Hardware/BOM/Assembly:**
H01–H03, S01–S12, E01–E05, B01–B03, A01–A03

**Phase 5 — Hinge & Mechanism A:**
F01–F09, MA01–MA09

**Phase 6 — Design guidelines (assessment only):**
DG-01–DG-09
