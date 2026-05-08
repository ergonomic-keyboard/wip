# Final Requirements — Split Keyboard

All requirements use **shall** language and are deterministic and verifiable unless placed in the **Design Guidelines** section at the end.

---

## 1. Layout & Input

**REQ-L01** — The system shall use the passhutk ergogen website to capture finger tap positions and generate a JSON layout for the split keyboard.

**REQ-L02** — The system shall convert the passhutk JSON output into a `config.yaml` compatible with ergogen.xyz.

**REQ-L03** — The ergogen-generated layout shall match the passhutk JSON in switch absolute positions (within 0.05 mm), relative positions (within 0.05 mm), orientations/rotations, and switch-edge-size.

**REQ-L04** — Each column (pinky, ring, middle, index, inner, and thumb) shall have exactly 3 keys. The user shall provide at least 3 finger taps per column; additional taps beyond 3 are permitted and encouraged as they are used by the passhutk layout tool to determine the key switch positions.

**REQ-L06** — Within a single finger column, all key rectangles shall be projected onto the column axis (fitted line) and rotated so their edges are perpendicular to that line. Keys within a column shall not rotate relative to each other.

**REQ-L07** — The thumb cluster shall be the only zone permitted to have a separate splay/rotation angle independent of the matrix columns.


**REQ-L08** — If it is impossible to generate a config.yaml for the thumb keys based on the finger tap json layout, the user shall be asked to specify either, a rotation in degrees that allows the rotation of the 3 thumb keys around a common center of origin at a radius R (located roughly at the handpalm) in mm. If that still does not allow the user to generate a valid config.yaml for the ergogenxyz, then the user may be asked to enter the key.spread:, key.splay:  and key.origin: [00, 0] directly.

**REQ-L09** — The system shall provide a "Tune Scale" calibration function: a modal displaying a reference line, user entry of measured physical width in mm, computing px/mm from CSS pixel width / entered mm. The calibrated value shall persist across sessions via localStorage.

**REQ-L10** — The ergopadToErgogen converter shall produce ergogen config parameters (spread, stagger, splay, padding) that reconstruct the stage 1 key positions when processed by ergogen's placement algorithm. The converter shall simulate ergogen's rotation stack and inverse-solve for world-space zone_anchor positions.

**REQ-L11** — The user shall be able to export finger position data (tap coordinates, calibrated PPM, canvas dimensions) as JSON and reload it. Loading shall scale positions correctly if canvas dimensions differ from the original.

**REQ-L12** — In the first screen where the finger taps are added the user shall be able to zoom in and out the key switches using 2 keyboard buttons/shortcuts that do not interfere with the normal browser/rest of the website. (The scale tuning number shall change on a 1:1 ratio with the zoomlevel if it was specified earlier).
---

## 2. Validation

**REQ-V01** — For each key, the distance between the tapped switch position and the ergogen-computed position shall be less than the tolerance defined in REQ-L03 (0.05 mm). If exceeded, the system shall flag the specific key with its position delta and throw an error.

**REQ-V02** — The relative arrangement of keys (center-to-center distances and directions between adjacent keys) shall be preserved between tapped input and ergogen output. The system shall detect if ergogen reorders, collapses, or distorts spatial relationships.

**REQ-V03** — No two switches shall occupy the same position. The center-to-center distance between every pair of keys shall exceed the switch housing diagonal. This check shall apply both within each column and across columns.

**REQ-V04** — Validation shall recompute every time a finger tap is added or removed, without requiring navigation to a separate page.

**REQ-V05** — Validation errors shall be displayed directly on the page 1 canvas, overlaid on the affected key positions, using color-coded indicators (red for invalid, green for valid) and a human-readable summary message below the toolbar.

**REQ-V06** — If validation detects overlapping switches or position mismatches exceeding the threshold, the Next button to page 2 shall be disabled and the error shall be displayed prominently.

---

## 3. Hardware — Switches & Keys

**REQ-H01** — The keyboard shall use Cherry MX ULP switches (ref: keeb.supply/products/cherry-mx-ulp).

**REQ-H02** — Soldering shall not be required for keyboard assembly. All electrical connections shall use solderless methods (hot-swap sockets, press-fit, or similar).

**REQ-H03** — Each keycap in the 3D render and final product shall display the selected keyboard layout, e.g. QWERTY or Dvorak letter or symbol (Space, Tab, Backspace, Enter, etc.). A keycap legend set or sticker overlay sheet shall be included in the BOM.
---

## 4. Hardware — Structure

**REQ-S01** — The keyboard shall consist of two separate, independent halves.

**REQ-S02** — The board outline shall be smoothed from the raw ergogen staircase output:
- Index finger side: straight edge.
- Top edge: arc with radius determined by the angle between index and pinky columns.
- Pinky side: straight edge.
- Bottom edge: smaller arc.
- Thumb cluster: 8–12 mm fillet/border around thumb keys.
- Perimeter fillet shall be at least 8 mm.

**REQ-S03** — The board outline, switch plate, and wooden frame shall extend to cover all thumb keys. The thumb cluster shall not be a floating island; it shall be structurally connected to the main matrix area.

**REQ-S04** — The frame material shall be 2 mm thick bamboo plywood (Z-axis material thickness). The frame shall be two-part milled construction (bottom backbone + top bezel).

**REQ-S05** — The frame wall width (XY-plane border around the PCB/plate) shall be at least 4 mm.

**REQ-S06** — Fasteners shall be M2 heat-set brass threaded inserts (pressed into the frame from the bottom) paired with M2 countersunk flat-head bolts from the top. Bolt heads shall sit flush with the surface.

**REQ-S07** — Each half shall have at least 7 mounting points, including near the thumb bridge, center of the middle column, and inner-bottom area.

**REQ-S08** — A 0.5 mm natural cork gasket sheet shall be placed between the bottom plate and PCB, and between the PCB and switch plate. Total stack height increase shall be 1.0 mm (from 3.8 mm to 4.8 mm).

**REQ-S09** — The overall keyboard thickness shall be minimized within the requirement compliant design space. The total stack height shall not exceed 4.8 mm (bottom plate + cork + PCB + cork + switch plate), excluding the frame bezel and keycaps.


**REQ-S10** — A battery area shall be designated on the PCB (under/beside the MCU, or along the thumb padding space in slender form factors). The design shall accommodate the battery without increasing board thickness or width beyond what is required by the key layout.

**REQ-S11** — A battery connector footprint shall be present on the PCB, and physical clearance shall be verified (bottom plate cutout or recess if needed).

**REQ-S12** — The key positions and cutout locations in the switch plate shall use expanded key padding (`px + 4` for board outline, `px + 8` for frame) to produce a smooth, continuous perimeter around all keys including the thumb cluster.

---

## 5. Hardware — Hinge & Folding

**REQ-F01** — The folding mechanism shall connect the two halves at the center (approximately between the R and T key positions). It shall be made of metal and shall weigh at most 50 grams total.

**REQ-F01a** — The mechanism shall support two independent rotation axes:
  (a) **Fold axis** (horizontal, from user belly to screen): The two halves shall fold from flat on the table (0 degrees) to fully tented (at most 90 degrees). Around that axis it, ideally should also be foldable to be closed. 
**REQ-F01b** — If a single mechanism (e.g., ball joint) cannot provide both axes with the required range, the two connecting poles to the hinge mechanism shall be disconnectable (e.g., via magnetic breakaway or quick-release) so the halves can be separated to fold flat. 1 or 2 magnetic connectors may be used in the hinge poles for this purpose. In that case the 2 keyboard halves fold close against eachother and stay in place with 2 or 3 magnets embedded in the keyboard wood frame.
The keycap surfaces shall face each other when folded (inward fold).
  (b) **Butterfly axis** (vertical, perpendicular to the table surface): When flat on the table, the two halves shall rotate forward and backward like wings (toward/away from the screen) up to approximately 45 degrees from the centerline.

**REQ-F01b** — The butterfly rotation range (up to ~45 degrees) may be limited due to geometric constraints (e.g. the thumb pads bumping into eachother) at various fold angles from 0 to 90 degrees.


**REQ-F01d** — The hinge shall be lockable/fixable at a chosen tenting angle. The tenting angle shall be determined by the cable turnbuckle settings (REQ-F09).

**REQ-F05** — Two horizontal cables shall connect the two halves of the keyboard on the bottom plate of the keyboard: one across the top row (approximately Q to P), one across the bottom row (approximately Z to M). These cables shall prevent the keyboard from collapsing under gravity/key press force.

**REQ-F06** — Cables shall use quick-release clevis pins with spring-loaded ball detent for one-handed press-button detach. Clevis brackets shall be recessed into the frame edge.

**REQ-F07** — The quick-release clevis pins with spring-loaded ball detent shall be positioned such that when the keyboard is folded closed, it will be on a flat surface on the backside of the board, and not at the edge of the keyboard. 

**REQ-F08** — When detached, the cables shall wrap around the closed keyboard to keep it shut (like a rope around a diary). Two elastic bands shall secure the cables around the closed keyboard regardless of turnbuckle position, so the user does not need to adjust turnbuckle length each time the keyboard is folded.

**REQ-F09** — The cables shall include turnbuckles for adjustable tension/length, which controls the tenting angle and the butterfly wing rotation around the vertical axis.

---

## 6. Electronics & Connectivity

**REQ-E01** — The keyboard shall use the nice!nano wireless MCU.

**REQ-E02** — The keyboard shall support the following connectivity modes:
  (a) One half connected to the other via USB-C, the other to a laptop.
  (b) Both halves connected directly to a laptop via USB-C.
  (c) Fully wireless operation over Bluetooth, if the Bluetooth option is enabled on the chip.
  (d) In wired modes, Bluetooth shall be completely disableable via firmware configuration.

Note: A non-wireless MCU option (without Bluetooth/Wi-Fi module) is out of scope for this project.

**REQ-E03** — Each half shall have one USB-C port for charging and/or data.

**REQ-E04** — Two 301230 LiPo batteries (one per half) shall be included in the BOM. Battery placement shall be visible in assembly.scad.

**REQ-E05** — Keyboard firmware shall be available and functional for the nice!nano MCU (e.g., ZMK or equivalent).

---

## 7. Bill of Materials & Sourcing

**REQ-B01** — A complete Bill of Materials shall be produced, listing every component required to build the keyboard.

**REQ-B02** — Each BOM item shall include a link to an online supplier and the price per element.

**REQ-B03** — The BOM shall include: cork gasket sheets, bamboo plywood sheets, M2 heat-set brass inserts, M2 countersunk flat-head bolts, quick-release clevis pins, turnbuckle cable assemblies, elastic bands, ball-joint hinge mechanism, Cherry ULP switches, keycaps (with legends or sticker sheet), nice!nano MCUs, 301230 LiPo batteries, and USB-C connectors.

---

## 8. Assembly

**REQ-A01** — All nuts, bolts, screws, and inserts required for assembly shall be specified in the BOM with their positions documented.

**REQ-A02** — Files required for CNC-cutting/laser-cutting the wood frame pieces shall be generated and included in the project output.

**REQ-A03** — A builder's guide (`grandma_builder.md`) shall be produced containing only the sequential steps required for a non-technical person to assemble the keyboard from the kit.

---

## 9. 3D Render & Visualization

**REQ-R01** — The system shall produce an interactive 3D viewer (not just static PNG renders). The user shall be able to orbit, zoom, and pan. The user shall see a small legend with the keyboard navigation shortcuts in the top right of the screen.

**REQ-R02** — The 3D model shall update automatically when the input config changes (i.e., `generate.sh` produces a viewable 3D file).

**REQ-R03** — The 3D model shall show all components: bamboo bottom plate, cork gaskets, FR-4 PCB, switch plate, wooden frame surround, keycaps, nice!nano MCU, USB-C ports, batteries, hinge, cables, and fasteners.

**REQ-R04** — An exploded view shall be togglable. In exploded view, all layers (bottom plate, cork, PCB, switch plate, frame) shall be distinguishable by material and labeled.

**REQ-R05** — Keycaps shall respond to click with a press animation.

**REQ-R06** — The center joint/hinge shall visually articulate when the fold angle changes. Each component (barrel, ball, rod stubs, mounting flanges, thumb nut) shall rotate/translate to match the fold angle.

**REQ-R07** — The butterfly wing rotation slider shall be available and its range shall be restricted by not allowing overlap/collision between any components (of the 2 sides, nor folding mechanism) depending on the fold slider setting. The fold slider shall always have full range. If a fold angle is selected at which the butterfly wing rotation slider constraints are violated, the butterfly wing rotation slider shall return to the nearest valid constrained (maximum) angle in degrees.

**REQ-R08** — When the fold slider is adjusted, both halves shall remain fully visible and correctly positioned at all fold angles (0 to 270 degrees) and all butterfly angles (0 to ~45 degrees). No half shall disappear, clip through the ground plane, or produce visual artifacts. The pivot point shall be the hinge center axis.

**REQ-R09** — Cables shall visually connect to their keyboard edge attachment points. When folding, cables shall animate their release at the quick-release clevis pins and wrap around the other side.

**REQ-R10** — The nice!nano USB-C ports shall be rendered as chrome/metallic connectors with a dark opening, identifiable as USB-C at a glance.

**REQ-R11** — Keycap and switch positions in the 3D render shall be exactly aligned with switch plate cutouts. The coordinate offset shall be computed from the config.yaml directly, not from any generated svgs.

**REQ-R12** — Key legends shall be rendered as flat plane meshes on top of keycaps using canvas textures, with correct rotation matching key orientation.

**REQ-R13** — The bamboo/wood material shall use a pronounced normal map for surface relief and appropriate roughness/metalness PBR values. Visible grain lines, growth rings, node bands, tonal variation, and fiber detail shall be present.

**REQ-R14** — Fold direction in the 3D render shall match REQ-F01a (inward fold, keycap surfaces face each other when folded).

**REQ-R15** — No render clipping shall occur during fold at any angle. Clipping planes shall rotate with their respective halves.

**REQ-R16** — The 3D render shall visually reflect REQ-S03: the thumb cluster shall appear connected to the main body in all views (not as a floating island).

---

## 10. Stage Fidelity

**REQ-SF01** — Key positions and orientations computed in stage 1 (finger position canvas) shall be reproduced in stage 2 (ergogen output / 3D render) within the tolerance defined in REQ-L03 (0.05 mm) for all keys (bottom, home, top) in each column including the thumb column. Per-row padding shall match stage 1's center-of-gravity-based asymmetric placement.

**REQ-SF02** — Switch rectangles drawn on the page 1 canvas shall have their edges perpendicular to the column regression line. The rotation angle shall be `PI/2 + atan(slope)` applied via `ctx.rotate(-rad)` in canvas coordinates.

**REQ-SF03** — Adding more finger taps to a column shall spread the 3 switch positions outward naturally using center-of-gravity of upper/lower halves of projected taps. The stage 1 drawCanvas algorithm shall not be modified.

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
