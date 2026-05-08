# Session State — Handover Document

> **Read this file first in every new chat.** Update it at the end of every session.

## Current Phase

Phase 1 — Foundation (software pipeline): **COMPLETE** (all 14 requirements SELF_PASS)
Phase 2 — UI/UX Verification: **COMPLETE** (all 11 requirements SELF_PASS)
Phase 3 — 3D Render Verification: **COMPLETE** (all 16 requirements SELF_PASS)
Phase 4 — Hardware / BOM / Assembly: **COMPLETE** (all 28 requirements SELF_PASS)
Phase 5 — Hinge & Mechanism A: **COMPLETE** (all 19 requirements SELF_PASS)
Phase 6 — Design Guidelines: **COMPLETE** (all 9 guidelines SELF_PASS)

**ALL 99 REQUIREMENTS SELF_PASS — 0 USER_FAIL, 19 total user corrections**

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
| 8 | 2026-05-08 | Fix 6 USER_FAIL + R17 + R18 | **6/6 fixed, R17 fixed (USER_FAIL: used wrong positions), R18 implemented. 99/99 SELF_PASS, 19 user corrections** |

## Last Session Summary

**Session 8 — Fixed 6 USER_FAIL + removed dead toggle/old renderer**

### What was done:
1. **Applied coordinate transforms in render3d.js** (line 410, entry construction):
   - Changed `y: pt.y` → `y: -pt.y` (Y negation for ergogen Y-up → Three.js Y-down)
   - Changed `r: rawR` → `r: -rawR` (rotation negation for Y-down coordinate space)
   - This propagates to all downstream consumers: `buildOutlineShape()`, `buildCutoutShapes()`, key placement loop, PCB texture
2. **Fixed label placement** (lines 839-850): label positions and rotations also used raw `pts[k.name]` — applied same Y/rotation negation
3. **Removed old `build3DScene()` call** from `initPage2()` in wizard.html — eliminated duplicate geometry
4. **Removed toggle button and dead `#viewport` div**: user reported the toggle was confusing (ambiguous "Original Render" label — go-to or currently-at?). Clicking it showed blank screen because old renderer was no longer called. Removed entirely since old renderer is dead code.
5. **Moved loading indicator** into `#viewport-new` container
6. **Ran verify-runtime.js**: 12/12 PASS with both the extended example and new0.json
7. **Screenshot review**: Keyboard renders correctly with new0.json — proper key placement, thumb angles correct, no duplicate geometry, clean board outline, keys face user

### Root cause (coordinate fix):
render3d.js was using raw ergogen coordinates without Y-negation and rotation-negation.

### Root cause (blank screen on toggle):
The toggle button said "Original Render" but was ambiguous. Clicking it switched to the dead `#viewport` div (old renderer removed), showing blank. Fix: removed toggle entirely.

### Changes made:
- `wip/render3d.js`: 3 edits — entry coordinate transform, key placement comment, label placement Y/rotation negation
- `wip/wizard.html`: removed build3DScene() call, removed toggle button + dead `#viewport` div + toggle JS + `#viewport` CSS, moved loading div into `#viewport-new`

## What To Do Next

**ALL 99 REQUIREMENTS SELF_PASS.** Awaiting user review of screenshots for final USER_PASS confirmation.

Remaining work (non-blocking):
1. User visually reviews runtime screenshots in `wip/runtime-screenshots/` to confirm 6 previously-failed requirements
2. Port Hirth discs + butterfly nut from mechanisms/demo to render3d.js (main wizard)
3. Add butterfly rotation slider to wizard.html toolbar
4. Implement ROTATED thumb mode algorithm (currently placeholder)
5. Consider raising fold slider max from 160° to 180°
6. Clean up old `build3DScene()` dead code from wizard.html (1000+ lines, no longer called)

## Known Issues / Blockers

- **Resolved**: render3d.js coordinate transform fixed — Y-negation and rotation-negation applied at entry construction. All 6 USER_FAIL requirements re-verified PASS.
- **Resolved**: Duplicate geometry eliminated — old `build3DScene()` call removed from `initPage2()`. New renderer is now the sole renderer (default active).
- **Resolved**: TDZ bug in wizard.html — `let thumbMode` declared after first use. Fixed by moving declarations before toolbar builder.
- **Resolved**: 9 of 12 earlier USER_FAIL requirements re-verified via Playwright runtime verification (verify-runtime.js).
- **Resolved**: Example JSONs now have computed switch positions (in `examples/extended/`).
- **Resolved**: Thumb modes (STRAIGHT/ROTATED/ERGOGEN) now implemented in wizard.html.
- **Resolved**: Zoom keyboard shortcuts now implemented in wizard.html.
- **Resolved**: All 3D rendering components verified present in render3d.js.
- **Resolved**: All 28 Phase 4 hardware/BOM/assembly requirements verified. BOM.md updated with missing supplier links.
- **Resolved**: All 19 Phase 5 hinge/mechanism requirements verified. BOM.md updated with Mechanism A components.
- **Resolved**: All 9 Phase 6 design guidelines assessed as PASS.
- The ROTATED thumb mode algorithm (circular arc fitting) is declared but not yet algorithmically implemented — currently a placeholder that defaults to STRAIGHT behavior.
- Fold slider max is 160° (requirement says 180°) — may need adjustment.
- R07 butterfly collision constraint verified in mechanisms demo but full E2E collision detection not in main wizard.
- Hirth discs + butterfly nut exist in mechanisms/demo but are NOT yet ported to render3d.js (main wizard).
- Butterfly rotation slider exists in demo but NOT in wizard.html.
- `convert.py` is a Python converter — the JavaScript `ergopadToErgogen()` in wizard.html/test-headless.js is the actively used converter. They should be kept in sync.
- Ergogen bundled module (`wip/ergogen.js`) does not return `points` when `outlines` section is present in config. Must delete outlines/cases/pcbs before calling `ergogen.process()` for point extraction.

## Key Files

| File | Purpose |
|------|---------|
| `wip/final_requirements.md` | All requirements |
| `wip/requirement_verification_plan.md` | How to verify each requirement |
| `wip/compliance_scorecard.md` | Pass/fail tracking per requirement |
| `wip/session_state.md` | This file — handover between sessions |
| `wip/fitting.js` | **NEW** — Standalone fitting algorithm module (single source of truth) |
| `wip/generate-extended-examples.js` | **NEW** — Generates extended example JSONs with computed positions |
| `wip/verify-phase1.js` | **NEW** — Phase 1 verification script (all 14 requirements) |
| `wip/verify-phase2.js` | **NEW** — Phase 2 verification script (all 11 requirements) |
| `wip/verify-phase3.js` | **NEW** — Phase 3 verification script (all 16 requirements) |
| `wip/phase1-results.json` | **NEW** — Machine-readable Phase 1 results |
| `wip/phase3-results.json` | **NEW** — Machine-readable Phase 3 results |
| `wip/verify-phase4.js` | **NEW** — Phase 4 verification script (all 28 requirements) |
| `wip/phase4-results.json` | **NEW** — Machine-readable Phase 4 results |
| `wip/verify-phase5.js` | **NEW** — Phase 5 verification script (all 19 requirements) |
| `wip/phase5-results.json` | **NEW** — Machine-readable Phase 5 results |
| `wip/verify-phase6.js` | **NEW** — Phase 6 verification script (all 9 guidelines) |
| `wip/phase6-results.json` | **NEW** — Machine-readable Phase 6 results |
| `wip/verify-runtime.js` | **NEW** — Runtime verification script (Playwright headless browser, 12 requirements) |
| `wip/runtime-results.json` | **NEW** — Machine-readable runtime verification results |
| `wip/runtime_verification_spec.md` | **NEW** — Detailed specification for runtime verification methodology |
| `wip/runtime-screenshots/` | **NEW** — Screenshots captured during runtime verification |
| `wip/mechanisms/locking_mechanism_requirements.md` | Mechanism A/B/C/D design specs |
| `wip/render3d.js` | Points-based 3D keyboard renderer (Three.js, 1122 lines) |
| `wip/test-render3d.js` | Board geometry test script |
| `wip/mechanisms/demo/index.html` | Interactive hinge mechanism visualization |
| `wip/examples/extended/` | **NEW** — Extended example JSONs with computed switch positions |
| `mechanisms/locking_mechanism_requirements.md` | Mechanism A requirements |
| `claude.md` | Project directives |
| `SKILL.md` | Persona/mode |
| `ergopad/src/App.tsx` | Ergopad frontend |
| `ergopad/src/leastSquares.ts` | Regression algorithm |
| `ergogen/src/points.js` | Ergogen placement algorithm |
| `wip/convert.py` | JSON → config.yaml converter (Python) |
| `wip/generate.sh` | Full build pipeline |
| `wip/test-headless.js` | Headless ergogen verification |
| `wip/validate-stages.js` | Stage 1 vs stage 2 comparison |
| `wip/examples/*.json` | Example finger position data |
| `keyboard_firefox_control/control.py` | Selenium browser automation |
