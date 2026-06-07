# Session State — Handover Document

> **Read this file first in every new chat.** Update it at the end of every session.

## Current Phase

Phase 1 — Foundation (software pipeline): **COMPLETE** (all 14 requirements SELF_PASS)
Phase 2 — UI/UX Verification: **COMPLETE** (all 11 requirements SELF_PASS)
Phase 3 — 3D Render Verification: **COMPLETE** (R01-R37 all SELF_PASS except R35 NOT_STARTED)
Phase 4 — Hardware / BOM / Assembly: **COMPLETE** (all SELF_PASS — R03, R10, S10, E04, H02 fixed via R22-R25→R30-R36)
Phase 5 — Hinge & Mechanism A: **COMPLETE** (all 19 requirements SELF_PASS)
Phase 6 — Design Guidelines: **COMPLETE** (all 9 guidelines SELF_PASS)

**128+ total requirements (REQ-KM01–KM10 added). 6 USER_FAIL (S07, S07.1-S07.5 — screw placement, user told AI to stop fixing), 1 NOT_STARTED (R35), 4 SUPERSEDED (R22-R25). 32+ total user corrections.**

## Session History

| Session | Date | Requirements Attempted | Outcome |
|---------|------|----------------------|---------|
| 0 | 2026-05-08 | Planning only | Created verification plan, scorecard, handover mechanism |
| 1 | 2026-05-08 | L01, L02, L03a, L03b, L04, L04a, L05, L09, L10, V01a, V01b, V02, V03, SF01 | **14/14 SELF_PASS** |
| 2 | 2026-05-08 | L06, L07, L07a, L07b, L08, L11, V04, V05, V06, SF02, SF03 | **11/11 SELF_PASS** |
| 3 | 2026-05-08 | R01–R16 | **16/16 SELF_PASS** |
| 4 | 2026-05-08 | H01–H03, S01–S12, E01–E05, B01–B03, A01–A03 | **28/28 SELF_PASS** |
| 5 | 2026-05-08 | F01–F01d, F05–F09, MA01–MA09, DG-01–DG-09 | **28/28 SELF_PASS** (19 Phase 5 + 9 Phase 6) |
| 6 | 2026-05-08 | User bug reports + runtime verification | **12 USER_FAIL detected, TDZ bug fixed, 12/12 runtime re-verified PASS** |
| 7 | 2026-05-08 | User screenshot review + root cause analysis | **6 new USER_FAIL: R03, R11, R14, SF01, S03, DG-01. Root cause: render3d.js uses wrong coordinate system** |
| 8 | 2026-05-08 | Fix 6 USER_FAIL + R17-R20 + thumb fix | **6/6 fixed, R17 fixed, R18-R20 implemented, thumb positions corrected. 101/101 SELF_PASS, 19 user corrections** |
| 9 | 2026-05-09 | Fix R19 + R20 USER_FAIL | **R19: 180° Z rotation via boardRoot group. R20: fold remapped (180°=flat, 0°=closed, 270°=tented). 21 user corrections** |
| 10 | 2026-05-09 | Fix labels/angle/hinge + R21 butterfly | **Labels counter-rotated for boardRoot, angle annotation reversed, hinge pivot at top surface, R21 butterfly fold 0-45° with butterflyRoot group. 102 requirements, 23 user corrections** |
| 11 | 2026-05-10 | Fix R18 annotation + R21 butterfly axis + MCU/battery violations | **R18: origin moved to thumb col, inner axis flipped. R21: butterfly changed from X-axis tilt to per-half Z-axis Hirth rotation, fixed compounding bug. MCU/battery/USB-C misplacement identified → 5 USER_FAIL (R03, R10, S10, E04, H02), 4 new requirements added (R22-R25). 28 user corrections** |
| 12 | 2026-05-10 | Fix MCU/battery/USB-C placement (R22-R25 + 5 USER_FAIL) | **9/9 fixed. MCU at half center on PCB, battery between bottom plate/PCB with recess, USB-C at outer edge oriented outward. All positions from bbox. 106/106 SELF_PASS, 28 user corrections** |
| 13 | 2026-05-10 | Per-layer visibility toggles (R26-R29) | **4/4 implemented. 6 layer groups with userData.layerId, setLayerVisible API, 6 checkboxes in toolbar, label sprites tagged for R28. 110/110 SELF_PASS** |
| 14 | 2026-05-10 | R30-R34, R36 implemented + R37 axes fixed | **6/7 R30-R36 implemented (R35 remains NOT_STARTED). R37 axes fixed (3rd attempt — moved to scene, world-space coords). 113/118 SELF_PASS, 30 user corrections** |
| 15-16 | 2026-05-14 | S07.1-S07.5 screw placement + T03 counter columns | **S07.1-S07.5 screw placement attempted 5-8× each, FAIL after multiple user corrections. User told AI to stop. T03 counter columns implemented in req-tracker.html. Counter data stored in per-commit status files.** |
| 17-18 | 2026-06-07 | REQ-KM01–KM10 Key Mapping feature + 3D label fixes | **Key Mapping page implemented (page 1b, now step 2). Layout presets (QWERTY/Dvorak/Colemak/Colemak-DH), key picker, save/load/export/import. 3D preview labels: 3 bugs found and fixed (meta.mirrored unreliable, left/right swap from boardRoot 180° Z rotation, thumb label rotation using raw ergogen instead of stage 1 overrides). 2 user corrections (right-half labels swapped, thumb label angle).** |

## Last Session Summary

**Sessions 17-18 — Key Mapping Feature (REQ-KM01–KM10) + 3D Label Bug Fixes**

### What was done:

#### Key Mapping Page (REQ-KM01–KM10) — IMPLEMENTED
1. **REQ-KM01**: New wizard page "Key Mapping" inserted as step 2 (between Finger Positions and 3D Preview). Wizard renumbered to 5 steps.
2. **REQ-KM02**: Switch position naming scheme `{half}{column}{row}` using lowercase alpha only `[a-z]+` (e.g., `lmt` = left-middle-top, `rit` = right-index-top).
3. **REQ-KM03**: Layout presets — QWERTY, Dvorak, Colemak, Colemak-DH (36-key, 3 layers each).
4. **REQ-KM04**: Key picker with ZMK keycode groups (Alpha, Numbers, Symbols, Modifiers, Nav, Editing, Function, Special).
5. **REQ-KM05**: Save/load keymap as standalone JSON files.
6. **REQ-KM06**: Custom mapping names validated as lowercase alpha only `[a-z]+`.
7. **REQ-KM07**: Dedicated save/load separate from project export/import.
8. **REQ-KM08**: 3D preview uses `window.configuredKeymap` (render3d.js reads it via `getActiveKeymaps()`). Firmware generation and test suite also use configured keymap.
9. **REQ-KM09**: Global `configuredKeymap` state object with `name`, `preset`, `customOverrides`, `layer0`–`layer2`.
10. **REQ-KM10**: Export/import includes keymap in project JSON.

#### 3D Preview Label Bugs — 3 BUGS FIXED (2 user corrections)

**Bug 1 — Right half showed "yuiop" layout (pre-existing)**:
- Root cause: `getKeymapLabel()` didn't reverse `colIdx` for right-half keys. Ergogen's `colIdx 0` = pinky (outer) but `layer0` stores right keys inner→outer.
- Fix: `col = isRight ? (nColsHalf - 1 - key.colIdx) : key.colIdx` in both render3d.js and wizard.html.

**Bug 2 — Right half showed left-half labels (QAZ, QWERT) — USER CORRECTION #1**:
- Root cause: `buildKeyPositionMap()` used `!!pt.meta?.mirrored` which was unreliable (could be undefined for mirror keys). The scene-building code already used the robust check `pt.meta?.mirrored === true || name.startsWith('mirror_')`.
- Fix: Updated `buildKeyPositionMap()` in render3d.js, wizard.html, and test-headless.js to use the same robust `mirror_` name prefix fallback.
- **Additional root cause**: Even with correct left/right detection, labels were visually swapped because `boardRoot.rotation.z = Math.PI` flips left↔right. Left-half geometry ends up on visual right and vice versa.
- Fix: In render3d.js `getKeymapLabel()`, split into `physRight` (which half the key belongs to, for key list lookups) and `mapRight = !physRight` (which side of the keymap array to read). This maps left geometry to right-hand labels and vice versa, so after 180° rotation the labels match the visual sides.

**Bug 3 — Thumb label angle mismatched keycaps — USER CORRECTION #2**:
- Root cause: Labels used raw ergogen point positions/rotations (`pts[k.name]`), but thumb keycap geometry uses stage 1 override positions (`leftKeys` array with overridden x/y/r from `config._stage1Keys`). Stage 1 overrides change thumb rotation significantly.
- Fix: Created `scenePositions` Map from the scene-building `leftKeys`/`rightKeys` arrays (which have stage 1 overrides applied). Label placement now uses `scenePositions.get(k.name)` instead of `pts[k.name]`.

### Changes made:
- `wip/wizard.html`: New page 1b (Key Mapping) with toolbar/grid/tabs, 5-step navigation, layout presets, key picker, save/load, export/import integration, firmware/test keymap wiring. Fixed `buildKeyPositionMap()` mirrored detection. Fixed left/right point filtering for PCB texture and instanced meshes.
- `wip/render3d.js`: Dynamic keymap via `getActiveKeymaps()`/`getZmkToLabel()`, fixed `buildKeyPositionMap()` mirrored detection, fixed `getKeymapLabel()` with `physRight`/`mapRight` split for boardRoot 180° rotation, added `scenePositions` Map for stage 1 thumb override positions, label placement uses scene positions.
- `wip/test-headless.js`: Fixed mirrored detection to use `mirror_` name prefix fallback.

## What To Do Next

**Priority 1: Verify 3D label fix — user should confirm thumb labels now align with keycaps after hard refresh**

The thumb label angle fix (using `scenePositions` instead of raw ergogen pts) was applied but not yet visually confirmed by the user. The left/right swap fix was confirmed working by user screenshot.

**Priority 2: S07.2, S07.4, S07.5 — Screw placement fixes (USER_FAIL, deferred)**

These were attempted 5-8 times each and failed. User said "Do not try to fix it." The core challenge is the boardRoot 180° Z rotation causing persistent confusion about which model half maps to which screen side. Key insight: screws are computed on left model half and cloned to right. The user sees the RIGHT model half on the LEFT side of screen (where Y, H, N keys appear). To fix S07.2 (N key), the screw needs to be placed at `matrix_inner_bottom` on the RIGHT model half, or the cloning logic needs rethinking.

**Priority 3: R35 — Post-processing script for B.Cu footprint flip**

R35 is the only NOT_STARTED requirement. It requires a post-processing step in `generate.sh` to flip the nice!nano footprint from F.Cu to B.Cu in the generated `.kicad_pcb` file.

**Priority 4: T03 verification**

T03 counter columns implemented and showing data. User confirmed layout but should verify hover notes and toggle functionality work correctly.

Other:
- Visual verification of R30-R37 (user screenshot review pending)
- The ROTATED thumb mode algorithm is still a placeholder (defaults to STRAIGHT behavior)
- Old `build3DScene()` dead code still in wizard.html (~1000 lines, no longer called)
- `convert.py` and JS `ergopadToErgogen()` should be kept in sync

## Known Issues / Blockers

- **Resolved**: R03, R10, S10, E04, H02 — MCU/battery/USB-C repositioned within board halves (session 12)
- **Resolved**: R22-R25 — Component placement from bbox, superseded by R30-R36 (session 14)
- **Resolved**: R30-R34, R36 — Backside MCU at pinky column, USB-C in frame slot, shared pocket (session 14)
- **Resolved**: R37 — Axes indicator in world space, added to scene directly (session 14, 3rd attempt)
- **Resolved**: R21 butterfly — per-half Z-axis rotation with combined fold+butterfly quaternion
- **Resolved**: R18 angle annotation — origin at thumb col, correct arc direction
- **Resolved**: R19 board orientation — boardRoot with 180° Z rotation
- **Resolved**: R20 fold semantics — 180°=flat, 0°=closed, 270°=tented
- **Resolved**: Labels counter-rotated for boardRoot
- **Resolved**: Hinge pivot at Z_SWITCH_PLATE_TOP for clean fold
- **Resolved**: T03 — Counter columns in req-tracker (session 15-16). Counter data in per-commit status files.
- **Resolved**: 3D label left/right swap — `buildKeyPositionMap()` now uses `mirror_` name prefix fallback; `getKeymapLabel()` uses `physRight`/`mapRight` split to account for boardRoot 180° Z rotation (session 17-18)
- **Resolved**: Thumb label angle mismatch — labels now use `scenePositions` Map (stage 1 overrides) instead of raw ergogen pts (session 17-18)
- **Resolved**: REQ-KM01–KM10 Key Mapping feature — wizard page 1b, presets, picker, save/load, export/import, firmware/test wiring (session 17-18)
- **OPEN / USER_FAIL**: S07.2 — Screw at N key. Model-half/screen-side confusion. Left model half = screen right. Screws computed on left model half clone to right. User deferred fix.
- **OPEN / USER_FAIL**: S07.4, S07.5 — Screws at thumb key. Repeatedly swapped between two thumb keys. User deferred fix.
- **OPEN**: Purple outlines fix — `setOutlinesVisible` now traverses `rightContent` for cloned outlineGroup (fixed in session 15-16)
- **OPEN**: Thumb label angle fix applied but not yet visually confirmed by user (session 17-18)
- The ROTATED thumb mode algorithm is a placeholder that defaults to STRAIGHT behavior
- Old `build3DScene()` dead code still in wizard.html (~1000 lines, no longer called)
- `convert.py` and JS `ergopadToErgogen()` should be kept in sync

## Key Files

| File | Purpose |
|------|---------|
| `wip/final_requirements.md` | All 118+ requirements (R22-R25 superseded, R30-R37 added, S07.1-S07.5 added, T03 added) |
| `wip/compliance_scorecard.md` | Pass/fail tracking per requirement (legacy — see also req-status/*.json) |
| `wip/session_state.md` | This file — handover between sessions |
| `wip/render3d.js` | Points-based 3D keyboard renderer (Three.js). Screw placement at ~line 1160-1330. |
| `wip/wizard.html` | Main wizard UI |
| `wip/fitting.js` | Standalone fitting algorithm module |
| `wip/req-tracker.html` | Requirements tracker UI with T03 counter columns (self-attempts, self-fails, user-corrections) |
| `wip/req-tracker.js` | Requirements tracker Node.js server (port 8099). `ensureStatus()` inherits status + counters. |
| `wip/req-status/*.json` | Per-commit requirement status files (keyed by short commit hash). Contains status, comment, selfAttempts, selfFails, userCorrections. |
| `wip/build-tracker-data.js` | Builds req-tracker-data.json for static/GitHub Pages mode |
| `wip/verify-runtime.js` | Runtime verification (Playwright, 12 checks) |
| `wip/test-screws.js` | Playwright headless test for screw position verification |
| `wip/mechanisms/demo/index.html` | Interactive hinge mechanism visualization |
| `wip/geometry.md` | Coordinate system & named anchors reference |
| `claude.md` | Project directives |
| `SKILL.md` | Persona/mode |

## Critical Technical Details for Future Sessions

### boardRoot 180° Z Rotation
- `boardRoot.rotation.z = Math.PI` — flips both X and Y axes
- Visual coordinates: `visual = (-model_x, -model_y, model_z)`
- Left model half (Q,W,E,R,T / A,S,D,F,G / Z,X,C,V,B) appears on **RIGHT** side of screen
- Right model half (Y,U,I,O,P / H,J,K,L,; / N,M,,,.,/) appears on **LEFT** side of screen
- Screws are computed on left model half, then cloned to right via `boardGroup.clone(true)`

### Switch Diagonal Corner Offsets (accounting for 180° Z flip)
- User top-left = model `(+SW, -SH)` where SW=7.1mm, SH=6.4mm
- User top-right = model `(-SW, -SH)`
- User bot-left = model `(+SW, +SH)`
- User bot-right = model `(-SW, +SH)`
- `placeScrewOnDiag()` rotates these by `key.r` splay angle before computing diagonal

### Thumb Key Identifiers
- `thumb_t_inner_cluster` (model pos ~242, 221) = highest model X = leftmost/outermost in user view
- `thumb_t_outer_cluster` (model pos ~202, 193) = lowest model X = hinge-side in user view

### 3D Label Placement (render3d.js)
- **Mirrored detection**: Both `buildKeyPositionMap()` and `buildNewScene()` must use `pt.meta?.mirrored === true || name.startsWith('mirror_')`. The `meta.mirrored` property is unreliable — some ergogen points only have the `mirror_` name prefix.
- **Left/right keymap inversion**: Because `boardRoot.rotation.z = Math.PI`, left-half geometry appears on the visual right (right hand) and vice versa. `getKeymapLabel()` uses `physRight` (actual half) for key list lookups and `mapRight = !physRight` for keymap array indexing.
- **Thumb positions**: Labels must use `scenePositions` Map (populated from scene-building `leftKeys`/`rightKeys` which have stage 1 thumb overrides), NOT raw ergogen `pts`. The stage 1 override changes thumb rotation significantly.
- **Label rotation formula**: `sp.r * Math.PI / 180 + Math.PI` where `sp.r` is scene degrees (already negated). The `+ Math.PI` counters `boardRoot`'s 180° Z rotation.
- **Right-half label position**: `x = 2 * hingeX - leftSx` (mirror left match position around hingeX). Rotation: `-leftSr` (mirror + boardRoot counter).

### Key Mapping Feature (REQ-KM01–KM10)
- wizard.html page 1b (step 2 of 5), between Finger Positions and 3D Preview
- `configuredKeymap` global: `{ name, preset, customOverrides, layer0, layer1, layer2 }`
- `window.configuredKeymap` read by render3d.js (`getActiveKeymaps()`) and firmware/test generators
- Custom mapping names: lowercase alpha only `[a-z]+` (for hardware requirement references)
- Layout presets: QWERTY, Dvorak, Colemak, Colemak-DH (36-key, 3 layers)
- Layer0 array format: rows interleaved `[L_pinky..L_inner, R_inner..R_pinky, ...]` (5 left + 5 right per row), then 3+3 thumb keys
