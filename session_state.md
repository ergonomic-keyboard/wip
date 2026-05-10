# Session State — Handover Document

> **Read this file first in every new chat.** Update it at the end of every session.

## Current Phase

Phase 1 — Foundation (software pipeline): **COMPLETE** (all 14 requirements SELF_PASS)
Phase 2 — UI/UX Verification: **COMPLETE** (all 11 requirements SELF_PASS)
Phase 3 — 3D Render Verification: **COMPLETE** (R01-R29 all SELF_PASS)
Phase 4 — Hardware / BOM / Assembly: **COMPLETE** (all SELF_PASS — R03, R10, S10, E04, H02 fixed via R22-R25)
Phase 5 — Hinge & Mechanism A: **COMPLETE** (all 19 requirements SELF_PASS)
Phase 6 — Design Guidelines: **COMPLETE** (all 9 guidelines SELF_PASS)

**118 total requirements. 0 USER_FAIL, 7 NOT_STARTED (R30-R36), 4 SUPERSEDED (R22-R25). 28 total user corrections.**

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

## Last Session Summary

**Session 13 — Per-layer visibility toggles (R26-R29)**

### What was done:
1. **R26 — Layer groups**: Created 6 THREE.Group objects tagged with `userData.layerId`: `bottomPlate`, `corkLower`, `pcb`, `corkUpper`, `switchPlate`, `keycaps`. All mesh creation redirected from flat `boardGroup.add()` to the appropriate layer group. Layer groups added to `boardGroup`. Meshes categorized:
   - `bottomPlate`: bottom plate extrusion, frame surround, battery recess
   - `corkLower`: cork lower extrusion, battery group
   - `pcb`: PCB extrusion, diodes, diode leads, MCU, USB-C port
   - `corkUpper`: cork upper extrusion
   - `switchPlate`: switch plate extrusion, switch housings
   - `keycaps`: keycap instanced mesh, stems, key label groups (left + right)

2. **R27 — Exploded + toggle independence**: Exploded view modifies `position.z` of individual meshes. Layer toggles modify `group.visible`. These are orthogonal — no interaction issues.

3. **R28 — Label sprite hiding**: Label sprites tagged with `userData.layerId`. `setLayerVisible()` hides labels when layer is hidden. `setLabelsVisible()` respects `layerVisibility` state — won't show a label whose layer is off.

4. **R29 — UI checkboxes**: 6 labeled checkboxes added to toolbar (after divider, with "Layers:" prefix): Keycaps, Switch Plate, Cork Upper, PCB, Cork Lower, Bottom Plate. All checked by default. Each wired to `setLayerVisible()` via change event.

### Changes made:
- `wip/render3d.js`: Layer group architecture, `setLayerVisible()` function, label tagging, `setLabelsVisible()` respects layer state
- `wip/wizard.html`: 6 layer toggle checkboxes + event handler loop
- `wip/final_requirements.md`: R26-R29 formatted
- `wip/compliance_scorecard.md`: R26-R29 SELF_PASS, totals updated to 110
- `wip/session_state.md`: This file updated

## What To Do Next

**Priority: Implement R30-R36 (backside MCU, frame USB-C slot, battery placement)**

R22-R25 are superseded. The new MCU/battery/USB-C placement (R30-R36) requires:
1. **R30**: Flip MCU to underside of PCB (Z_PCB, components facing down)
2. **R31**: MCU X = inside edge of pinky column, extending inward
3. **R32**: MCU Y = position USB-C port at frame edge, mill USB-C slot in frame
4. **R33**: Bottom plate milled pocket for MCU + cork lower cutout
5. **R34**: USB-C back as part of MCU mesh, remove createUsbCPort()
6. **R35**: generate.sh post-processing to flip footprint to B.Cu
7. **R36**: Battery adjacent to MCU in shared under-PCB cavity

R37 (axes/anchors indicator) is already implemented and SELF_PASS.

Other:
- The ROTATED thumb mode algorithm is still a placeholder (defaults to STRAIGHT behavior)
- Old `build3DScene()` dead code still in wizard.html (~1000 lines, no longer called)
- `convert.py` and JS `ergopadToErgogen()` should be kept in sync

## Known Issues / Blockers

- **Resolved**: R03, R10, S10, E04, H02 — MCU/battery/USB-C repositioned within board halves (session 12)
- **Resolved**: R22-R25 — Component placement from bbox (session 12)
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
| `wip/final_requirements.md` | All 106 requirements (R22-R25 newly added) |
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
