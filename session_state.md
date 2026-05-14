# Session State — Handover Document

> **Read this file first in every new chat.** Update it at the end of every session.

## Current Phase

Phase 1 — Foundation (software pipeline): **COMPLETE** (all 14 requirements SELF_PASS)
Phase 2 — UI/UX Verification: **COMPLETE** (all 11 requirements SELF_PASS)
Phase 3 — 3D Render Verification: **COMPLETE** (R01-R37 all SELF_PASS except R35 NOT_STARTED)
Phase 4 — Hardware / BOM / Assembly: **COMPLETE** (all SELF_PASS — R03, R10, S10, E04, H02 fixed via R22-R25→R30-R36)
Phase 5 — Hinge & Mechanism A: **COMPLETE** (all 19 requirements SELF_PASS)
Phase 6 — Design Guidelines: **COMPLETE** (all 9 guidelines SELF_PASS)

**118+ total requirements. 6 USER_FAIL (S07, S07.1-S07.5 — screw placement, user told AI to stop fixing), 1 NOT_STARTED (R35), 4 SUPERSEDED (R22-R25). 30+ total user corrections.**

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

## Last Session Summary

**Sessions 15-16 — Screw Placement (S07.1-S07.5) + T03 Requirement Tracker Counters**

### What was done:

#### Screw Placement (S07.1-S07.5) — FAILED, deferred by user
1. **S07.1 — Y key top-left diagonal**: Implemented rotation-aware `placeScrewOnDiag()` function that rotates corner offsets by key.r splay angle. Status: ASSUME (visually appears correct but not user-verified).
2. **S07.2 — N key bottom-left diagonal**: Multiple attempts. Root confusion: left model half (Q,W,E,R,T / A,S,D,F,G / Z,X,C,V,B) appears on RIGHT side of screen due to boardRoot 180° Z rotation. The key the user calls "N" is on the right model half (screen-left). Screws computed on left model half are cloned to right. Status: FAIL.
3. **S07.3 — P key top-right diagonal**: Status: ASSUME.
4. **S07.4 — Outermost thumb key top-right diagonal**: Repeatedly swapped between thumb_t_inner_cluster (outermost in user view) and thumb_t_outer_cluster (hinge-side). User's green arrows indicated hinge-side. Status: FAIL.
5. **S07.5 — Outermost thumb key bottom-right diagonal**: Same thumb key confusion as S07.4. Status: FAIL.
6. User explicitly said "You failed again, update the score. Do not try to fix it."

**Key technical insight for future sessions**: boardRoot has 180° Z rotation, flipping both X and Y axes visually. Left model half (keys B,G,T etc.) appears on screen RIGHT. Right model half (keys N,H,Y etc.) appears on screen LEFT. Corner offset mapping: user top-left = model (+SW, -SH), user top-right = model (-SW, -SH), user bot-left = model (+SW, +SH), user bot-right = model (-SW, +SH). Switch half-dims: SW=7.1mm, SH=6.4mm.

#### T03 — Requirement Tracker Counter Columns — IMPLEMENTED
1. Added 3 counter columns to the right of Delete button in req-tracker.html:
   - Self-attempts (🔄) — gray
   - Self-fails (❌) — red-tinted
   - User corrections (📝) — amber
2. Hover on user-corrections counter shows requirement comment as tooltip
3. Click on user-corrections counter pins/unpins the note permanently
4. Global 📝 toggle in section header toggles all notes on/off
5. Zero-value counters dimmed to 35% opacity
6. Counter data stored in per-commit status JSON files (`selfAttempts`, `selfFails`, `userCorrections` fields)
7. Fixed `ensureStatus()` in req-tracker.js to preserve counter fields when inheriting status to new commits
8. User confirmed layout is correct. Counter values were initially showing 0 because data was in `a71a540.json` but server was serving `9b458be.json` (current commit). Fixed by merging counter data into current commit's status file.

### Changes made:
- `wip/render3d.js`: Screw placement code with rotation-aware diagonals, debug labels, purple outlines fix for right half
- `wip/req-tracker.html`: T03 counter columns (CSS + JS), hover notes, pin/toggle functionality
- `wip/req-tracker.js`: `ensureStatus()` preserves counter fields + comments during inheritance
- `wip/req-status/9b458be.json`: Added S07.1-S07.5 entries with counter values and comments
- `wip/req-status/a71a540.json`: Original scorecard with counter data
- `wip/final_requirements.md`: S07.4/S07.5 requirement text updated (outermost thumb key)
- `wip/req-tracker-data.json`: Rebuilt for static mode

## What To Do Next

**Priority 1: S07.2, S07.4, S07.5 — Screw placement fixes (USER_FAIL, deferred)**

These were attempted 5-8 times each and failed. User said "Do not try to fix it." The core challenge is the boardRoot 180° Z rotation causing persistent confusion about which model half maps to which screen side. Key insight: screws are computed on left model half and cloned to right. The user sees the RIGHT model half on the LEFT side of screen (where Y, H, N keys appear). To fix S07.2 (N key), the screw needs to be placed at `matrix_inner_bottom` on the RIGHT model half, or the cloning logic needs rethinking.

**Priority 2: R35 — Post-processing script for B.Cu footprint flip**

R35 is the only NOT_STARTED requirement. It requires a post-processing step in `generate.sh` to flip the nice!nano footprint from F.Cu to B.Cu in the generated `.kicad_pcb` file.

**Priority 3: T03 verification**

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
- **OPEN / USER_FAIL**: S07.2 — Screw at N key. Model-half/screen-side confusion. Left model half = screen right. Screws computed on left model half clone to right. User deferred fix.
- **OPEN / USER_FAIL**: S07.4, S07.5 — Screws at thumb key. Repeatedly swapped between two thumb keys. User deferred fix.
- **OPEN**: Purple outlines fix — `setOutlinesVisible` now traverses `rightContent` for cloned outlineGroup (fixed in session 15-16)
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
