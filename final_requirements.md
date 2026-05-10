# Final Requirements — Split Keyboard

All requirements use **shall** language and are deterministic and verifiable unless placed in the **Design Guidelines** section at the end.

---
Y runs positiveley along the columns (top to bottom of keyboard). Z is vertical (up from the table). ?X runs from left to right?




## 0. Requirements Tracker

**REQ-T01** — The requirements progress page shall contain buttons for: PASS, Assumed Pass, SKIP, Comment (icon), and Delete (which turns into Undo after clicking it).

**REQ-T02** — The end of each requirement type section (e.g. "4. Hardware — Structure", "2. Validation") shall include a + button to append a new requirement in that section at the end.

---

## 1. Layout & Input

**REQ-L01** — The system shall use the passhutk ergogen website to capture finger tap positions and generate a JSON layout for the split keyboard.

**REQ-L02** — The system shall convert the computed switch positions from the passhutk JSON (per REQ-L10.2) into a `config.yaml` compatible with ergogen.xyz.

**REQ-L02.1** — The conversion shall use the computed switch positions and the fitting algorithm metadata, not the raw tap coordinates directly.
**REQ-L03a** — The fitting algorithm shall deterministically compute switch center positions (x, y in mm), rotations (degrees), and sizes (mm) from the raw tap coordinates, the calibrated PPM, and the selected fitting algorithm per column.

**REQ-L03a.1** — Given identical inputs (same taps, same PPM, same algorithm selection), the computed switch positions, rotations, and sizes shall be bit-identical.

**REQ-L03b** — The ergogen config.yaml, when processed by the ergogen engine, shall produce switch positions within 0.05 mm and rotations within 0.05 degrees compared to the computed switch positions from REQ-L03a.

**REQ-L03b.1** — The ergogen output shall produce matching switch-edge-sizes compared to the computed switch positions from REQ-L03a.

**REQ-L03b.2** — This tolerance (0.05 mm position, 0.05 degrees rotation) is the single source of truth for the taps-to-ergogen conversion fidelity.

**REQ-L04** — Each column (pinky, ring, middle, index, inner, and thumb) shall have exactly 3 keys.

**REQ-L04.1** — The user shall provide at least 3 finger taps per column.

**REQ-L04.2** — Additional taps beyond 3 are permitted and encouraged as they are used by the passhutk layout tool to determine the key switch positions.

**REQ-L04a** — The keyboard shall have 6 columns per half (pinky, ring, middle, index, inner, thumb) x 3 keys per column = 18 keys per half, 36 keys total.

**REQ-L04a.1** — The BOM quantities for switches, keycaps, and hot-swap sockets (where applicable) shall match this count.

**REQ-L05** — Within a single finger column, all key rectangles shall be projected onto the column axis (fitted line) and rotated so their edges are perpendicular to that line.

**REQ-L05.1** — Keys within a column shall not rotate relative to each other.

**REQ-L06** — The thumb cluster shall be the only zone permitted to have a separate splay/rotation angle independent of the matrix columns.

**REQ-L07** — The user shall select a thumb fitting mode from three options.

**REQ-L07.1** — STRAIGHT mode: The 3 thumb key centers shall be projected onto a best-fit regression line through the thumb taps, using the same CoG-based placement algorithm as matrix columns (REQ-SF03).

**REQ-L07.1a** — In STRAIGHT mode, all 3 thumb keys shall share one rotation angle (the line angle).

**REQ-L07.1b** — STRAIGHT mode shall always produce a valid ergogen config.yaml (splay=0, spread=inter-key distance along line).

**REQ-L07.2** — ROTATED mode: The 3 thumb key centers shall be placed on a circular arc.

**REQ-L07.2a** — In ROTATED mode, the user shall specify (or the system shall fit from taps) a center point and radius R.

**REQ-L07.2b** — In ROTATED mode, keys shall be spaced at angular intervals on the arc.

**REQ-L07.2c** — In ROTATED mode, each key's rotation shall be tangent to the arc.

**REQ-L07.2d** — ROTATED mode shall always produce a valid ergogen config.yaml (uniform splay per column, inverse-solved origin offsets).

**REQ-L07.3** — ERGOGEN mode: The user shall directly enter ergogen thumb zone parameters (key.spread, key.splay, key.origin per column).

**REQ-L07.3a** — In ERGOGEN mode, these values shall be passed through to the config.yaml verbatim.

**REQ-L07a** — The selected thumb mode and its parameters shall be stored in the export JSON (per REQ-L10).

**REQ-L07a.1** — For STRAIGHT: the line angle shall be stored.

**REQ-L07a.2** — For ROTATED: the center, radius, and angular offsets shall be stored.

**REQ-L07a.3** — For ERGOGEN: the raw ergogen params shall be stored.

**REQ-L07b** — When the user switches thumb mode, the stage 1 canvas shall immediately recompute and redraw the 3 thumb switch positions using the newly selected algorithm.

**REQ-L07b.1** — The previous thumb taps shall be preserved (not cleared) when switching thumb mode.

**REQ-L08** — The system shall provide a "Tune Scale" calibration function: a modal displaying a reference line, user entry of measured physical width in mm, computing px/mm from CSS pixel width / entered mm.

**REQ-L08.1** — The calibrated value shall persist across sessions via localStorage.

**REQ-L09** — The ergopadToErgogen converter shall produce ergogen config parameters (spread, stagger, splay, padding, origin).

**REQ-L09.1** — The produced parameters, when processed by ergogen's placement algorithm, shall reconstruct the computed switch positions from REQ-L03a within the tolerance of REQ-L03b.

**REQ-L09.2** — The converter shall simulate ergogen's cumulative rotation stack.

**REQ-L09.3** — The converter shall inverse-solve for world-space zone_anchor positions.

**REQ-L09.4** — For the thumb zone, the converter shall use the algorithm-specific parameter derivation corresponding to the selected thumb mode (REQ-L07).

**REQ-L10** — The user shall be able to export and reload layout data as JSON.

**REQ-L10.1** — The export shall include raw tap coordinates per column (as `{x, y}` arrays).

**REQ-L10.2** — The export shall include computed switch positions per key: center (x, y) in mm, rotation in degrees, and switch size (width, height) in mm.

**REQ-L10.3** — The export shall include the fitting algorithm used per column: `regression-line` for matrix columns; `STRAIGHT`, `ROTATED`, or `ERGOGEN` for the thumb column, plus the algorithm-specific parameters (per REQ-L07a).

**REQ-L10.4** — The export shall include `calibratedPPM`, `canvasWidth`, `canvasHeight`.

**REQ-L10.5** — Loading shall scale raw tap positions correctly if canvas dimensions differ from the original.

**REQ-L10.6** — After loading, the system shall recompute switch positions from the stored taps and algorithm, and verify they match the stored computed positions (within floating-point tolerance).

**REQ-L11** — In the first screen where the finger taps are added the user shall be able to zoom in and out the key switches using 2 keyboard buttons/shortcuts that do not interfere with the normal browser/rest of the website.

**REQ-L11.1** — The scale tuning number shall change on a 1:1 ratio with the zoomlevel if it was specified earlier.

---

## 2. Validation

**REQ-V01a** — (Boundary 1 — taps to computed switches) The system shall verify that the fitting algorithm (per REQ-L03a) produces deterministic switch positions from the stored raw taps.

**REQ-V01a.1** — On JSON reload, the recomputed switch positions shall match the stored computed positions within floating-point tolerance (< 1e-6 mm).

**REQ-V01a.2** — If they differ, the system shall flag a fitting algorithm inconsistency error.

**REQ-V01b** — (Boundary 2 — computed switches to ergogen output) For each key, the distance between the computed switch position (from REQ-L03a) and the ergogen-generated position (from the config.yaml processed by ergogen) shall be less than the tolerance defined in REQ-L03b (0.05 mm).

**REQ-V01b.1** — Rotation shall match within 0.05 degrees.

**REQ-V01b.2** — If exceeded, the system shall flag the specific key with its position and rotation delta and throw an error.

**REQ-V02** — The relative arrangement of keys (center-to-center distances and directions between adjacent keys) shall be preserved between the computed switch positions and the ergogen output.

**REQ-V02.1** — The system shall detect if ergogen reorders, collapses, or distorts spatial relationships.

**REQ-V03** — No two switches shall occupy the same position.

**REQ-V03.1** — The center-to-center distance between every pair of keys shall exceed the switch housing width.

**REQ-V03.2** — This check shall apply both within each column and across columns.

**REQ-V04** — Validation shall recompute every time a finger tap is added or removed, without requiring navigation to a separate page.

**REQ-V05** — Validation errors shall be displayed directly on the page 1 canvas, overlaid on the affected key positions, using color-coded indicators (red for invalid, green for valid).

**REQ-V05.1** — A human-readable summary message shall be displayed below the toolbar.

**REQ-V06** — If validation detects overlapping switches or position mismatches exceeding the threshold, the Next button to page 2 shall be disabled.

**REQ-V06.1** — The error shall be displayed prominently.

---

## 3. Hardware — Switches & Keys

**REQ-H01** — The keyboard shall use Cherry MX ULP switches (ref: keeb.supply/products/cherry-mx-ulp).

**REQ-H02** — Soldering shall not be required for keyboard assembly, with the sole exception of Cherry MX ULP switches, which are SMD-mount and require soldering to the PCB.

**REQ-H02.1** — All other electrical connections (MCU, battery connector, USB-C) shall use solderless methods (hot-swap sockets, press-fit, pin headers, or similar).

**REQ-H03** — Each keycap in the 3D render and final product shall display the selected keyboard layout, e.g. QWERTY or Dvorak letter or symbol (Space, Tab, Backspace, Enter, etc.).

**REQ-H03.1** — A keycap legend set or sticker overlay sheet shall be included in the BOM.

---

## 4. Hardware — Structure

**REQ-S01** — The keyboard shall consist of two separate, independent halves.

**REQ-S02** — The board outline shall be smoothed from the raw ergogen staircase output.

**REQ-S02.1** — Index finger side: straight edge.

**REQ-S02.2** — Top edge: arc with radius determined by the angle between index and pinky columns.

**REQ-S02.3** — Pinky side: straight edge.

**REQ-S02.4** — Bottom edge: smaller arc.

**REQ-S02.5** — Thumb cluster: 8-12 mm fillet/border around thumb keys.

**REQ-S02.6** — Perimeter fillet shall be at least 8 mm.

**REQ-S03** — The board outline, switch plate, and wooden frame shall extend to cover all thumb keys.

**REQ-S03.1** — The thumb cluster shall not be a floating island; it shall be structurally connected to the main matrix area.

**REQ-S04** — The frame material shall be 2 mm thick bamboo plywood (Z-axis material thickness).

**REQ-S04.1** — The frame shall be two-part milled construction (bottom backbone + top bezel).

**REQ-S05** — The frame wall width (XY-plane border around the PCB/plate) shall be at least 4 mm.

**REQ-S06** — Fasteners shall be M2 heat-set brass threaded inserts (pressed into the frame from the bottom) paired with M2 countersunk flat-head bolts from the top.

**REQ-S06.1** — Bolt heads shall sit flush with the surface.

**REQ-S07** — Each half shall have at least 7 mounting points, including near the thumb bridge, center of the middle column, and inner-bottom area.

**REQ-S07a** — Each mounting bolt shall pass through the top frame bezel and clamp through all intermediate layers (switch plate, cork, PCB, cork) into a heat-set brass insert in the bottom frame backbone.

**REQ-S07a.1** — All intermediate layers (switch plate, cork gaskets, PCB, bottom plate) shall have clearance holes at each mounting point.

**REQ-S07a.2** — The bolt-insert joint shall sandwich the full stack between the two frame pieces.

**REQ-S08** — The base layer stack (excluding cork gaskets, frame bezel, and keycaps) shall be: Bottom plate (bamboo) 2.0 mm (per REQ-S04), PCB (FR-4) 0.8 mm (standard 2-layer), Switch plate (bamboo or FR-4) 1.0 mm. Base total: 3.8 mm.

**REQ-S08.1** — The actual layer thicknesses shall be verified against the Cherry ULP switch datasheet and nice!nano PCB clearance requirements.

**REQ-S08.2** — If the datasheet requires different thicknesses, these values shall be updated and REQ-S09 recalculated accordingly.

**REQ-S08a** — A 0.5 mm natural cork gasket sheet shall be placed between the bottom plate and PCB, and between the PCB and switch plate.

**REQ-S08a.1** — Total stack height increase from cork shall be 1.0 mm.

**REQ-S09** — The overall keyboard thickness shall be minimized within the requirement-compliant design space.

**REQ-S09.1** — The total stack height shall not exceed 4.8 mm (3.8 mm base per REQ-S08 + 1.0 mm cork per REQ-S08a), excluding the frame bezel and keycaps.

**REQ-S10** — A battery area shall be designated on the PCB (under/beside the MCU, or along the thumb padding space in slender form factors).

**REQ-S10.1** — The design shall accommodate the battery without increasing the overall board width beyond what is required by the key layout.

**REQ-S10.2** — If the battery exceeds the available stack clearance, the bottom plate shall be locally milled thinner (cutout/recess) at the battery location to house it within the REQ-S09 stack height.

**REQ-S11** — A battery connector footprint shall be present on the PCB.

**REQ-S11.1** — Physical clearance shall be verified (bottom plate cutout or recess if needed).

**REQ-S12** — The key positions and cutout locations in the switch plate shall use expanded key padding (`px + 4` for board outline, `px + 8` for frame) to produce a smooth, continuous perimeter around all keys including the thumb cluster.

---

## 5. Hardware — Hinge & Folding

**REQ-F01** — The folding mechanism shall connect the two halves at the center (approximately between the R and T key positions).

**REQ-F01.1** — It shall be made of metal.

**REQ-F01.2** — It shall weigh at most 50 grams total.

**REQ-F01a** — The mechanism shall support two independent rotation axes.

**REQ-F01a.1** — Fold axis (horizontal, running from user belly toward screen): The two halves shall fold from flat on the table (0 degrees) to fully tented (at most 90 degrees).

**REQ-F01a.2** — Butterfly axis (vertical, perpendicular to the table surface): When flat on the table, the two halves shall rotate forward and backward like wings (toward/away from the screen) up to approximately 45 degrees from the centerline.

**REQ-F01b** — The butterfly rotation range (up to ~45 degrees) may be limited at certain fold angles due to geometric constraints (e.g., thumb pads colliding).

**REQ-F01b.1** — The 3D render shall enforce these collision limits per REQ-R07.

**REQ-F01c** — The keyboard shall fold fully closed for transport.

**REQ-F01c.1** — When folded closed, the keycap surfaces shall face each other (inward fold).

**REQ-F01c.2** — If a single mechanism cannot provide both the fold/butterfly range (REQ-F01a) and fold-to-close, the two connecting poles to the hinge shall be disconnectable (e.g., via magnetic breakaway or quick-release).

**REQ-F01c.3** — In that case, 2 or 3 magnets embedded in the keyboard wood frame shall hold the two halves closed.

**REQ-F01d** — The tenting angle shall be primarily determined and held by the cable turnbuckle settings (REQ-F09).

**REQ-F01d.1** — The hinge may optionally include a friction lock or thumb nut for additional rigidity on uneven/unstable surfaces.

**REQ-F01d.2** — If included, it shall not be required for normal desk use.

**REQ-F05** — Two horizontal cables shall connect the two halves of the keyboard on the bottom plate of the keyboard: one across the top row (approximately Q to P), one across the bottom row (approximately Z to M).

**REQ-F05.1** — These cables shall prevent the keyboard from collapsing under gravity/key press force.

**REQ-F06** — Cables shall use quick-release clevis pins with spring-loaded ball detent for one-handed press-button detach.

**REQ-F06.1** — Clevis brackets shall be recessed into the frame edge.

**REQ-F07** — The quick-release clevis pins with spring-loaded ball detent shall be positioned such that when the keyboard is folded closed, it will be on a flat surface on the backside of the board, and not at the edge of the keyboard.

**REQ-F08** — When detached, the cables shall wrap around the closed keyboard to keep it shut (like a rope around a diary).

**REQ-F08.1** — Two elastic bands shall secure the cables around the closed keyboard regardless of turnbuckle position, so the user does not need to adjust turnbuckle length each time the keyboard is folded.

**REQ-F09** — The cables shall include turnbuckles for adjustable tension/length, which controls the tenting angle and the butterfly wing rotation around the vertical axis.

---

## 6. Electronics & Connectivity

**REQ-E01** — The keyboard shall use the nice!nano wireless MCU.

**REQ-E02** — The keyboard shall support the following connectivity modes.

**REQ-E02.1** — Both halves communicate with each other over Bluetooth. One half connects to the laptop via USB-C; the other half syncs wirelessly to the first.

**REQ-E02.2** — Both halves connected directly to a laptop via USB-C (each half operates as an independent USB HID device).

**REQ-E02.3** — Fully wireless operation over Bluetooth (both halves to laptop, half-to-half over Bluetooth).

**REQ-E02.4** — In wired modes, Bluetooth shall be completely disableable via firmware configuration.

**REQ-E02.5** — Half-to-half communication shall use Bluetooth (not wired USB-C between halves). A non-wireless MCU option is out of scope.

**REQ-E03** — Each half shall have one USB-C port for charging and/or data.

**REQ-E04** — Two 301230 LiPo batteries (one per half) shall be included in the BOM.

**REQ-E04.1** — Battery placement shall be visible in assembly.scad.

**REQ-E05** — Keyboard firmware shall be available and functional for the nice!nano MCU (e.g., ZMK or equivalent).

---

## 7. Bill of Materials & Sourcing

**REQ-B01** — A complete Bill of Materials shall be produced, listing every component required to build the keyboard.

**REQ-B02** — Each BOM item shall include a link to an online supplier and the price per element.

**REQ-B03** — The BOM shall include the following components:

**REQ-B03.1** — Cork gasket sheets.

**REQ-B03.2** — Bamboo plywood sheets.

**REQ-B03.3** — M2 heat-set brass inserts.

**REQ-B03.4** — M2 countersunk flat-head bolts.

**REQ-B03.5** — Quick-release clevis pins.

**REQ-B03.6** — Turnbuckle cable assemblies.

**REQ-B03.7** — Elastic bands.

**REQ-B03.8** — Hinge mechanism (metal).

**REQ-B03.9** — Magnets for hinge pole disconnect and/or frame closure (per REQ-F01c).

**REQ-B03.10** — Cherry ULP switches.

**REQ-B03.11** — Keycaps (with legends or sticker sheet).

**REQ-B03.12** — nice!nano MCUs.

**REQ-B03.13** — 301230 LiPo batteries.

**REQ-B03.14** — USB-C connectors.

---

## 8. Assembly

**REQ-A01** — All bolts and inserts required for assembly shall be specified in the BOM with their positions documented.

**REQ-A01.1** — No screws or nuts shall be used; the design shall use only M2 bolts with heat-set brass inserts (per REQ-S06).

**REQ-A02** — Files required for CNC-cutting/laser-cutting the wood frame pieces shall be generated and included in the project output.

**REQ-A03** — A builder's guide (`grandma_builder.md`) shall be produced containing only the sequential steps required for a non-technical person to assemble the keyboard from the kit.

---

## 9. 3D Render & Visualization

**REQ-R01** — The system shall produce an interactive 3D viewer (not just static PNG renders).

**REQ-R01.1** — The user shall be able to orbit, zoom, and pan.

**REQ-R01.2** — The user shall see a small legend with the keyboard navigation shortcuts in the top right of the screen.

**REQ-R02** — The 3D model shall update automatically when the input config changes (i.e., `generate.sh` produces a viewable 3D file).

**REQ-R03** — The 3D model shall show all components: bamboo bottom plate, cork gaskets, FR-4 PCB, switch plate, wooden frame surround, keycaps, nice!nano MCU, USB-C ports, batteries, hinge, cables, and fasteners.

**REQ-R04** — An exploded view shall be togglable.

**REQ-R04.1** — In exploded view, all layers (bottom plate, cork, PCB, switch plate, frame) shall be distinguishable by material and labeled.

**REQ-R05** — Keycaps shall respond to click with a press animation.

**REQ-R06** — The center joint/hinge shall visually articulate when the fold angle changes.

**REQ-R06.1** — All hinge sub-components shall rotate/translate to match the fold angle.

**REQ-R06.2** — The specific sub-components rendered shall match the final hinge mechanism selected per REQ-F01.

**REQ-R07** — The butterfly wing rotation slider shall be available and its range shall be restricted by not allowing overlap/collision between any components (of the 2 sides, nor folding mechanism) depending on the fold slider setting.

**REQ-R07.1** — The fold slider shall always have full range.

**REQ-R07.2** — If a fold angle is selected at which the butterfly wing rotation slider constraints are violated, the butterfly wing rotation slider shall return to the nearest valid constrained (maximum) angle in degrees.

**REQ-R08** — The 3D render shall provide a fold slider covering the full range from flat (0 degrees) through tented (up to 90 degrees) through to fully closed (180 degrees).

**REQ-R08.1** — If the hinge mechanism requires disconnection to fold closed (per REQ-F01c), the render shall animate the disconnect (poles separating, magnets engaging) at the appropriate angle.

**REQ-R08.2** — Both halves shall remain fully visible and correctly positioned at all angles.

**REQ-R08.3** — No half shall disappear, clip through the ground plane, or produce visual artifacts.

**REQ-R08.4** — The pivot point shall be the hinge center axis.

**REQ-R09** — Cables shall visually connect to their keyboard edge attachment points.

**REQ-R09.1** — When folding, cables shall animate their release at the quick-release clevis pins and wrap around the other side.

**REQ-R10** — The nice!nano USB-C ports shall be rendered as chrome/metallic connectors with a dark opening, identifiable as USB-C at a glance.

**REQ-R11** — Keycap and switch positions in the 3D render shall be exactly aligned with switch plate cutouts.

**REQ-R11.1** — The coordinate offset shall be computed from the config.yaml directly, not from any generated svgs.

**REQ-R12** — Key legends shall be rendered as flat plane meshes on top of keycaps using canvas textures, with correct rotation matching key orientation.

**REQ-R13** — The bamboo/wood material shall use a pronounced normal map for surface relief and appropriate roughness/metalness PBR values.

**REQ-R13.1** — Visible grain lines, growth rings, node bands, tonal variation, and fiber detail shall be present.

**REQ-R14** — Fold direction in the 3D render shall match REQ-F01c (inward fold, keycap surfaces face each other when folded).

**REQ-R15** — No render clipping shall occur during fold at any angle.

**REQ-R15.1** — Clipping planes shall rotate with their respective halves.

**REQ-R16** — The 3D render shall visually reflect REQ-S03: the thumb cluster shall appear connected to the main body in all views (not as a floating island).

**REQ-R17** — You shall show the key switch outlines from the 1.Finger Positions as the highest layer in purple at 3 mm above the highest point of the board. (Don't edit them or anything, just a raw coordinate and rotational copy paste).

**REQ-R18** — You shall show the angle in degrees between the inner column line and the thumb column line in case the Thumb STRAIGHT option is shown. Also in purple (with a circular arrow between the two lines.)

**REQ-R19** — You shall render the board from a point of view like the user sees it when the user starts typing, so left is the left thumb pad (the left hand is also entered in stage 1 Figure Positions with the pinky column left and the left thumb in the BOTTOM right). So the thumbs are closer to the user than the other columns (NOT FURTHER AWAY).

**REQ-R20** — The render shall show the full fold to 0 degrees to 180 degrees flat on the table, to 270 degrees tilted.

**REQ-R21** — The render shall show the full fold to 0 degrees to 45 degrees butterfly as optional.

**REQ-R21.1** — You shall limit that degree based on the two halves bump into each other constraint at any given integer folding angle.

**REQ-R21.2** — The butterfly folds forward, away from user, toward screen. (horizontal line/as it is now is the normal/0 degrees.)

**REQ-R21.3** — In the GUI clearly indicate the limitation based on the fold angle if there is any limitation.

**REQ-R22** — ~~SUPERSEDED by REQ-R30.~~ *(Original: MCU on PCB top surface at half center.)*

**REQ-R23** — ~~SUPERSEDED by REQ-R33, REQ-R36.~~ *(Original: Battery between bottom plate and PCB with recess.)*

**REQ-R24** — ~~SUPERSEDED by REQ-R32, REQ-R34.~~ *(Original: USB-C at outer board edge as separate component.)*

**REQ-R25** — ~~SUPERSEDED by REQ-R30, REQ-R31, REQ-R32.~~ *(Original: Positions computed from bbox.)*

**REQ-R26** — The 3D render shall provide individual binary visibility toggles for each hardware layer.

**REQ-R26.1** — Keycaps toggle: Keycap meshes + key legends, default ON.

**REQ-R26.2** — Switch Plate toggle: Switch plate + switch housings/stems, default ON.

**REQ-R26.3** — Cork Upper toggle: Upper cork gasket, default ON.

**REQ-R26.4** — PCB toggle: PCB + MCU + USB-C + diodes + solder pads, default ON.

**REQ-R26.5** — Cork Lower toggle: Lower cork gasket + battery, default ON.

**REQ-R26.6** — Bottom Plate toggle: Bottom plate + battery recess, default ON.

**REQ-R26.7** — Each toggle shall independently show/hide that layer's meshes without affecting any other layer.

**REQ-R27** — Layer toggles shall work in both normal (assembled) view and exploded view.

**REQ-R27.1** — Toggling a layer off shall hide its meshes in whichever view mode is active.

**REQ-R27.2** — The exploded view separation and the layer toggles shall be independent controls.

**REQ-R28** — When a layer is toggled off, its exploded-view label (if any) shall also be hidden.

**REQ-R28.1** — Toggling the layer back on shall restore the label (if exploded view labels are enabled).

**REQ-R29** — The layer toggle controls shall be rendered as a row of labeled checkboxes (all checked by default), positioned near the existing fold/butterfly sliders in the 3D view toolbar.

**REQ-R29.1** — Each checkbox shall be labeled with its layer name.

**REQ-R30** — The nice!nano MCU shall be mounted on the underside of the PCB (components facing downward, toward the bottom plate).

**REQ-R30.1** — Its Z position shall place the MCU PCB flush against the underside of the main PCB at `Z_PCB`.

**REQ-R30.2** — The MCU's tallest component (USB-C connector, ~3.26mm) faces downward into a milled pocket in the bottom plate.

**REQ-R30.3** — The ergogen config shall include a back-side (`B.Cu`) footprint for the nice!nano, or the KiCad PCB file shall be post-processed to flip the MCU footprint to the back copper layer.

**REQ-R31** — The nice!nano shall be positioned so that its outer edge (the edge furthest from the hinge) aligns with the inside edge of the innermost pinky column key positions (colIdx 0).

**REQ-R31.1** — The MCU body extends from that edge inward (toward the hinge).

**REQ-R31.2** — The MCU is then rotated around the USB-C port position to match the local board edge angle (per REQ-R32).

**REQ-R31.3** — This ensures the MCU does not overlap with optional structures that may be added to the board perimeter (rubber feet, edge bolts, fillet radius).

**REQ-R32** — The nice!nano shall be positioned and rotated so that its USB-C port is flush with the nearest board outline edge (not protruding beyond it).

**REQ-R32.1** — The MCU shall be rotated to match the angle of the local board edge segment so the USB-C opening faces outward perpendicular to the edge.

**REQ-R32.2** — The frame shall have a rectangular cutout (milled slot) at the USB-C port location, aligned with the edge angle, sized to allow cable insertion.

**REQ-R32.3** — The USB-C connector face shall be coplanar with the outer frame surface.

**REQ-R32.4** — The slot shall be visible in the 3D render.

**REQ-R33** — The bottom plate shall have a milled pocket (recess) at the MCU location, deep enough to house the MCU body (1.6mm) plus its tallest downward-facing component (USB-C connector, ~3.26mm).

**REQ-R33.1** — The cork lower gasket shall have a matching cutout at the MCU location.

**REQ-R33.2** — The pocket shall be visible in the 3D render as a distinct recessed area in the bottom plate.

**REQ-R34** — The USB-C connector shall remain physically part of the nice!nano MCU mesh (not a separate component).

**REQ-R34.1** — It sits at the MCU's short edge closest to the board outline.

**REQ-R34.2** — Because the MCU is rotated to match the board edge angle (per REQ-R32), the USB-C opening naturally faces outward perpendicular to the edge and is accessible from outside the keyboard through the frame slot.

**REQ-R34.3** — The separate `createUsbCPort()` function shall be removed.

**REQ-R35** — The ergogen pipeline shall generate a post-processing script (in `generate.sh`) that flips the nice!nano footprint from `F.Cu` to `B.Cu` in the output `.kicad_pcb` file, preserving full automation of the PCB generation.

**REQ-R36** — The battery shall be positioned adjacent to the nice!nano MCU in the same under-PCB cavity, sharing the bottom plate milled pocket.

**REQ-R36.1** — The battery and MCU shall not overlap.

**REQ-R36.2** — Both shall fit within the board outline.

**REQ-R37** — The 3D render shall include a toggleable XYZ coordinate system indicator showing the model-space axes.

**REQ-R37.1** — Red = X axis (toward hinge), Green = Y axis (along columns), Blue = Z axis (up from table).

**REQ-R37.2** — Tick marks shall be placed at 10mm intervals with larger ticks at 100mm.

**REQ-R37.3** — Named spatial anchors (`bbox.min.x`, `hingeX`, `halfCenterX`, `bbox.min.y`, `bbox.max.y`, `center`) shall be marked with orange diamond markers and labels at their positions on the board.

**REQ-R37.4** — The indicator shall be toggled via an "Axes" checkbox in the toolbar, unchecked by default.

**REQ-R37.5** — The coordinate system and named anchors shall be documented in `wip/geometry.md`.

**REQ-R38** — The axis indicator origin shall be positioned at the top key of the pinky column (colIdx 0, minimum Y in model space) at the switch plate surface (Z_SWITCH_PLATE_TOP).

**REQ-R38.1** — This places the origin at the top-left switch as seen on screen.

**REQ-R38.2** — The origin label shall display the model-space coordinates of this position.

**REQ-R39** — The angle of the USB-C port (and thus the rotation of the nice!nano MCU) shall be determined by sampling the board outline at two points: the left edge and the right edge of the USB-C port opening.

**REQ-R39.1** — The angle is computed as `atan2(dy, dx)` between these two sampled points.

**REQ-R39.2** — This method works regardless of whether the local board edge is a straight line, a fillet arc, or any other curve — it produces the correct tangent angle at the USB-C port width scale.

**REQ-R39.3** — The MCU shall be rotated by this angle so the USB-C face is parallel to the local edge at those two points.

---

## 10. Stage Fidelity

**REQ-SF01** — The computed switch positions and orientations stored in the export JSON (per REQ-L10.2) shall be reproduced in the ergogen output and 3D render within the tolerance defined in REQ-L03b (0.05 mm position, 0.05 degrees rotation) for all keys in all columns, including the thumb column regardless of thumb mode.

**REQ-SF01.1** — Per-row padding shall match stage 1's center-of-gravity-based asymmetric placement.

**REQ-SF01.2** — This requirement is verified by REQ-V01b.

**REQ-SF02** — Switch rectangles drawn on the page 1 canvas shall have their edges perpendicular to the column regression line.

**REQ-SF02.1** — The rotation angle shall be `PI/2 + atan(slope)` applied via `ctx.rotate(-rad)` in canvas coordinates.

**REQ-SF03** — Adding more finger taps to a column shall spread the 3 switch positions outward naturally using center-of-gravity of upper/lower halves of projected taps.

**REQ-SF03.1** — The stage 1 drawCanvas algorithm shall not be modified.

---

## Design Guidelines (Subjective / Non-Verifiable)

These are aesthetic and experiential goals that guide design decisions but are not pass/fail verifiable. They may be taken into consideration after all other requirements are met, and taken into account where it does not lead to incredible challenges during the process of generating requirement compliance.

**DG-01** — The board outline should feel like a single deliberate shape, not an artifact of the layout tool.

**DG-02** — The overall rendering should look like a professional product visualization: soft shadows, PBR materials with correct roughness/metalness, anti-aliased edges, subtle environment reflections on metallic parts, ACES filmic tone mapping.

**DG-03** — The bamboo material should be recognizable as bamboo/wood at a glance, not bland plastic.

**DG-04** — After all functional requirements are met, a design pass should refine the overall shape: smooth every edge, add intentional asymmetry where it serves ergonomics, and ensure the silhouette reads as a single coherent form.

**DG-05** — The overall thickness should be kept as thin as possible while meeting structural and acoustic requirements.

**DG-06** — The cable quick-release mechanism should require zero thought to operate in daily use.

**DG-07** — The keyboard when folded should form a compact, non-colliding package.

**DG-08** — The typing acoustics should be dampened and pleasant, not hollow or rattling.

**DG-09** — The frame should look like a natural material (bamboo), not like a plastic imitation.
