# Session State — Handover Document

> **Read this file first in every new chat.** Update it at the end of every session.

## Current Phase

Phase 1 — Foundation (software pipeline): **COMPLETE** (all 14 requirements SELF_PASS)
Phase 2 — UI/UX Verification: **COMPLETE** (all 11 requirements SELF_PASS)
Phase 3 — 3D Render Verification: **COMPLETE** (all 16 requirements SELF_PASS)
Phase 4 — Hardware / BOM / Assembly: **COMPLETE** (all 28 requirements SELF_PASS)
Phase 5 — Hinge & Mechanism A: **COMPLETE** (all 19 requirements SELF_PASS)
Phase 6 — Design Guidelines: **COMPLETE** (all 9 guidelines SELF_PASS)

**ALL 101 REQUIREMENTS SELF_PASS — 0 USER_FAIL, 21 total user corrections**

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

## Last Session Summary

**Session 9 — Fixed R19 board orientation + R20 fold semantics**

### What was done:
1. **R19 — Board orientation fix**: User reported that the camera-only fix was insufficient — thumbs were still on the wrong side. Applied a 180° rotation around the Z axis (axis sticking out of the table upward) by wrapping all board geometry (leftHalf, rightHalf, hingeGroup, cablesGroup, label sprites) in a `boardRoot` THREE.Group with `rotation.z = Math.PI`. Camera position and target updated to world-space coordinates accounting for the rotation (`worldHingeX = -hingeX`, `worldCenterY = -center.y`).

2. **R20 — Fold semantics fix**: User reported fold was inverted — 0° was flat and halves pushed through each other at higher angles. Remapped slider semantics:
   - 180° = flat/open on table (default)
   - 0° = closed (halves folded onto each other)
   - 270° = tented (halves open past flat, inverted V)
   - Internal conversion: `internalDeg = 180 - sliderDeg`
   - Updated slider default value to 180 in wizard.html
   - Cable visibility now checks for slider value 180 (flat) instead of 0

3. **Scorecard updated**: R19 and R20 marked with USER_FAIL #1 and fix notes

### Changes made:
- `wip/render3d.js`: Added `boardRoot` group with Z rotation, camera uses world coords, `applyFold()` remapped from slider semantics to internal fold angle, hinge articulation uses `internalDeg`
- `wip/wizard.html`: Fold slider default 180°, cable visibility checks slider===180
- `wip/compliance_scorecard.md`: R19/R20 updated with USER_FAIL + fix

## What To Do Next

**ALL 101 REQUIREMENTS SELF_PASS.** Awaiting user review for final USER_PASS confirmation.

Remaining work (non-blocking):
1. User visually reviews R19 (board orientation) and R20 (fold mechanics) in browser
2. Port Hirth discs + butterfly nut from mechanisms/demo to render3d.js (main wizard)
3. Add butterfly rotation slider to wizard.html toolbar
4. Implement ROTATED thumb mode algorithm (currently placeholder)
5. Clean up old `build3DScene()` dead code from wizard.html (1000+ lines, no longer called)

## Known Issues / Blockers

- **Resolved**: R19 board orientation — wrapped in boardRoot with 180° Z rotation
- **Resolved**: R20 fold semantics — remapped: 180°=flat, 0°=closed, 270°=tented
- **Resolved**: render3d.js coordinate transform — Y-negation and rotation-negation applied
- **Resolved**: Duplicate geometry — old renderer removed, new renderer is sole renderer
- **Resolved**: TDZ bug in wizard.html — fixed
- **Resolved**: All runtime verification checks pass (12/12)
- The ROTATED thumb mode algorithm is a placeholder that defaults to STRAIGHT behavior
- Hirth discs + butterfly nut exist in mechanisms/demo but NOT yet ported to render3d.js
- Butterfly rotation slider exists in demo but NOT in wizard.html
- `convert.py` and JS `ergopadToErgogen()` should be kept in sync

## Key Files

| File | Purpose |
|------|---------|
| `wip/final_requirements.md` | All requirements |
| `wip/requirement_verification_plan.md` | How to verify each requirement |
| `wip/compliance_scorecard.md` | Pass/fail tracking per requirement |
| `wip/session_state.md` | This file — handover between sessions |
| `wip/fitting.js` | Standalone fitting algorithm module (single source of truth) |
| `wip/generate-extended-examples.js` | Generates extended example JSONs with computed positions |
| `wip/verify-phase1.js` | Phase 1 verification script (all 14 requirements) |
| `wip/verify-phase2.js` | Phase 2 verification script (all 11 requirements) |
| `wip/verify-phase3.js` | Phase 3 verification script (all 16 requirements) |
| `wip/verify-phase4.js` | Phase 4 verification script (all 28 requirements) |
| `wip/verify-phase5.js` | Phase 5 verification script (all 19 requirements) |
| `wip/verify-phase6.js` | Phase 6 verification script (all 9 guidelines) |
| `wip/verify-runtime.js` | Runtime verification script (Playwright headless browser, 12 requirements) |
| `wip/render3d.js` | Points-based 3D keyboard renderer (Three.js) |
| `wip/wizard.html` | Main wizard UI |
| `wip/mechanisms/demo/index.html` | Interactive hinge mechanism visualization |
| `wip/examples/extended/` | Extended example JSONs with computed switch positions |
| `claude.md` | Project directives |
| `SKILL.md` | Persona/mode |
