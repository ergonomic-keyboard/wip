# Session State — Handover Document

> **Read this file first in every new chat.** Update it at the end of every session.

## Current Phase

Phase 1 — Foundation (software pipeline): **COMPLETE** (all 14 requirements SELF_PASS)
Phase 2 — UI/UX Verification: **COMPLETE** (all 11 requirements SELF_PASS)
Phase 3 — 3D Render Verification: **COMPLETE** (R01-R37 all SELF_PASS except R35 NOT_STARTED)
Phase 4 — Hardware / BOM / Assembly: **COMPLETE** (all SELF_PASS — R03, R10, S10, E04, H02 fixed via R22-R25→R30-R36)
Phase 5 — Hinge & Mechanism A: **COMPLETE** (all 19 requirements SELF_PASS)
Phase 6 — Design Guidelines: **COMPLETE** (all 9 guidelines SELF_PASS)

**118 total requirements. 0 USER_FAIL, 1 NOT_STARTED (R35), 4 SUPERSEDED (R22-R25). 30 total user corrections.**

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

## Last Session Summary

**Session 14 — Backside MCU placement (R30-R36) + Axes fix (R37)**

### What was done:
1. **R30 — MCU on PCB underside**: Rewrote `createNiceNano()` — MCU body at `Z_PCB - NANO_PCB_T/2`, ICs face downward (negative Z offsets), solder pads on top side (toward PCB).

2. **R31 — MCU X at pinky column**: Computed `pinkyInnerEdgeX` from colIdx=0 keys (`Math.max(...pinkyKeys.map(k => k.x)) + kx/2`). MCU center X = `pinkyInnerEdgeX + NANO_W/2`, extending inward toward hinge.

3. **R32 — USB-C at frame edge**: MCU Y computed so USB-C port (at MCU's -Y end) falls into frame edge at `bbox.min.y`. Formula: `nanoY = bbox.min.y + frameWall + USB_H/2 + NANO_L/2`. Milled USB-C slot mesh added to bottomPlate layer.

4. **R33 — Bottom plate milled pocket**: Pocket spanning MCU + battery area in bottom plate (recessMesh at Z_BOTTOM). Cork lower matching cutout (corkCutoutMesh at Z_CORK_LOWER). Both in correct layer groups.

5. **R34 — USB-C as part of MCU**: USB-C connector integrated into `createNiceNano()` mesh at MCU's -Y short edge. Removed separate `createUsbCPort()` function.

6. **R36 — Battery adjacent to MCU**: Battery at `battX = nanoLeftX + NANO_W/2 + 8` (8mm gap from MCU edge), same Y as MCU. Top at Z_PCB, extends into shared bottom plate pocket.

7. **R37 — Axes indicator (3rd attempt)**: Moved `axisGroup` from `boardRoot` to `scene` directly. World-space coordinates computed from model coords (`-model_X, -model_Y, model_Z`). Added arrowhead cones, 10mm tick marks, axis endpoint labels with model-space direction descriptions. Named anchor markers for bbox, hinge, center. Hidden by default, toggled via Axes checkbox.

### Changes made:
- `wip/render3d.js`: Complete rewrite of MCU/battery/USB-C section (R30-R34, R36), axes indicator (R37)
- `wip/compliance_scorecard.md`: R30-R34, R36 → SELF_PASS, R37 updated (3 attempts, 2 user corrections), totals updated
- `wip/session_state.md`: This file updated

## What To Do Next

**Priority: R35 — Post-processing script for B.Cu footprint flip**

R35 is the only NOT_STARTED requirement. It requires a post-processing step in `generate.sh` to flip the nice!nano footprint from F.Cu to B.Cu in the generated `.kicad_pcb` file.

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
- The ROTATED thumb mode algorithm is a placeholder that defaults to STRAIGHT behavior
- Old `build3DScene()` dead code still in wizard.html (~1000 lines, no longer called)
- `convert.py` and JS `ergopadToErgogen()` should be kept in sync

## Key Files

| File | Purpose |
|------|---------|
| `wip/final_requirements.md` | All 118 requirements (R22-R25 superseded, R30-R37 added) |
| `wip/compliance_scorecard.md` | Pass/fail tracking per requirement |
| `wip/session_state.md` | This file — handover between sessions |
| `wip/render3d.js` | Points-based 3D keyboard renderer (Three.js) |
| `wip/wizard.html` | Main wizard UI |
| `wip/fitting.js` | Standalone fitting algorithm module |
| `wip/verify-runtime.js` | Runtime verification (Playwright, 12 checks) |
| `wip/mechanisms/demo/index.html` | Interactive hinge mechanism visualization |
| `wip/geometry.md` | Coordinate system & named anchors reference |
| `claude.md` | Project directives |
| `SKILL.md` | Persona/mode |
