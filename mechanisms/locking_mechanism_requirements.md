# Locking Mechanism Requirements

This document specifies four candidate hinge/locking mechanisms for the split keyboard. All mechanisms shall satisfy the parent requirements in `final_requirements.md` (REQ-F01 through REQ-F09). The mechanisms differ in how they lock the two rotation axes (fold and butterfly).

Cross-references: REQ-F01 (center mount, metal, ≤50 g), REQ-F01a (fold 0–90°, butterfly ±45°), REQ-F01c (fold-to-close / disconnect), REQ-F01d (lap rigidity), REQ-F05–F09 (cables, clevis, turnbuckles).

---

## Shared Requirements (all mechanisms)

**REQ-M01** — The mechanism shall mount at the center edge of the keyboard (between the R and T key positions), consistent with REQ-F01.

**REQ-M02** — The mechanism shall be made entirely of metal (steel, brass, or aluminium) and shall weigh at most 50 g total, consistent with REQ-F01.

**REQ-M03** — The mechanism shall provide two independent rotation axes per REQ-F01a:
  (a) Fold axis: belly-to-screen direction, 0–90°.
  (b) Butterfly axis: perpendicular to fold axis, ±45° from centerline.

**REQ-M04** — The mechanism shall allow fold-to-close for transport per REQ-F01c. If the mechanism cannot continuously rotate to 180°, the two connecting poles shall be disconnectable (magnetic breakaway or quick-release) so the halves can be folded flat against each other.

**REQ-M05** — Two hooked cable rods with turnbuckles (per REQ-F05, REQ-F09) shall connect the two halves at the top row and bottom row. These cables are the primary structure that sets the tenting angle and prevents collapse. The cable system is independent of the locking mechanism and shall be present in all mechanism options.

**REQ-M06** — The mechanism shall be operable by hand without tools. Adjusting both axes from a seated position (desk or lap) shall not require more than 10 seconds.

**REQ-M07** — On a lap (no flat surface, no cable tension line), the mechanism shall hold both axes rigid enough to resist at least 5 N of downward key-press force without angle drift.

---

## Mechanism A — Turnbuckle + Hirth Coupling (Recommended)

### Description

Each keyboard half has an angled hinge rod extending from its center edge toward a shared center eye. The rods are angled (~15° upward from the keyboard plane) so that when folded closed, the inner edges clear each other before the outer edges meet. A hinge pin through the center eye provides the fold rotation axis (belly-to-screen). A turnbuckle adjustment rod connects the two hinge rods below the keyboard plane and sets the fold angle by its effective length. On the back (bottom face) of each keyboard half, a Hirth half-moon disc lies flat. When the butterfly angle is set, the two discs mesh and a butterfly nut (or cam lever) clamps them together. A quick-release magnet at the center eye allows disconnection for fold-to-close.

### Requirements

**REQ-MA01** — Each half shall have one angled hinge rod (metal, ~25 mm length) extending from the center edge toward the shared center eye. The rod shall be angled approximately 15° above the keyboard plane to provide fold-to-close clearance.

**REQ-MA02** — A center hinge eye (metal ring/bushing) shall join the two angled rods at the fold axis. A hinge pin through the eye, oriented along the belly-to-screen axis (Z), shall provide 360° rotation for the fold degree of freedom.

**REQ-MA03** — A turnbuckle adjustment rod (metal) shall connect the two hinge rods approximately 6–10 mm below the hinge center. The turnbuckle shall set the fold angle by adjusting its effective length. Shorter length = more tented; longer length = flatter.

**REQ-MA04** — The turnbuckle attachment points to the hinge rods shall be ball-joint or clevis connections, allowing the angular offset that occurs when the fold angle changes.

**REQ-MA05** — A quick-release magnet (neodymium, ≥2 N pull force) at the center eye shall allow the two halves to disconnect for fold-to-close per REQ-M04. When disconnected, each half retains its hinge rod stub and turnbuckle arm as a captive assembly (no loose parts).

**REQ-MA06** — Each keyboard half shall have one Hirth half-moon disc mounted flat on the back (bottom face) of the keyboard, near the center edge. The disc shall lie in the XZ plane (parallel to the keyboard surface) with its toothed face oriented toward the opposing half's disc.

**REQ-MA07** — The Hirth discs shall have a diameter of 60–80 mm. Tooth count options:
  (a) 72 teeth (5° resolution): 9 selectable positions in a 45° butterfly range. Tooth width at 60 mm ≈ 2.6 mm (robust, near-standard).
  (b) 120 teeth (3° resolution): 15 selectable positions in a 45° butterfly range. Tooth width at 80 mm ≈ 2.1 mm (good precision/robustness balance).
  The selected tooth count shall be documented in the BOM.

**REQ-MA08** — A butterfly nut or cam lever shall clamp the two Hirth discs together, preventing butterfly rotation. The clamping force shall be sufficient to resist key-press force without tooth disengagement. The clamp shall be operable with one hand.

**REQ-MA09** — When the Hirth discs are unclamped (butterfly nut loosened), the user shall be able to rotate the butterfly angle freely to the next tooth position. The teeth shall self-align when clamped.

### Strengths

- Positive locking on both axes (turnbuckle geometry + Hirth teeth). No friction reliance.
- Repeatable butterfly positions (same tooth = same angle).
- Fold angle set by turnbuckle length — no separate lock operation needed for fold axis.
- Decoupled axes: changing fold does not affect butterfly, and vice versa.
- Low part count: 2 rods, 1 eye, 1 pin, 1 turnbuckle, 2 half-moon discs, 1 nut.

### Weaknesses

- Butterfly angle is discrete (5° or 3° steps), not continuous.
- Hirth discs add diameter to the underside of the keyboard (~60–80 mm).
- Custom Hirth discs may need to be ordered from a specialist manufacturer.

### Suppliers

- [TEDISA](https://www.tedisa-hirth.com/) — standard Hirth couplings from 50 mm diameter, custom tooth counts available.
- [TAC Rockford](https://tacrockford.com/product/machine-components/milling-machine/hirth-couplings-face-gears/) — custom Hirth couplings per drawing.

---

## Mechanism B — Oarlock + Bolt-draw

### Description

A central fold hinge rod provides the fold axis. Each keyboard half has an oarlock eye (metal loop) at its center edge; the hinge rod passes through both eyes. Two additional rods pass through the eyes perpendicular to the fold rod. A draw bolt runs front-to-back (Z axis) through each keyboard half — on the left half from Z-to-W, on the right half from M-to-O. The bolt has a knurled grip cylinder at the user-facing end. Rotating the grip draws the rod's end-nut inward, pulling the half into butterfly rotation. This provides continuous butterfly adjustment.

### Requirements

**REQ-MB01** — A central fold hinge rod (metal, ~20 mm length) shall pass through both oarlock eyes, oriented along the belly-to-screen axis (Z). The rod shall provide 360° fold rotation.

**REQ-MB02** — Each keyboard half shall have an oarlock eye (metal loop, ~8 mm outer diameter torus) at its center edge, rigidly attached to the keyboard body. The fold hinge rod shall pass through both eyes.

**REQ-MB03** — Two oarlock rods shall pass through the eyes perpendicular to the fold rod (left-to-right direction), one near the top row and one near the bottom row. Each rod shall have a stopper nut at each end to prevent the rod from sliding out.

**REQ-MB04** — Each keyboard half shall have one draw bolt running front-to-back (along the Z axis) through the keyboard body. The bolt shall be threaded and freely rotatable. The bolt head shall be a knurled grip cylinder (≥8 mm diameter) accessible at the user-facing edge of the keyboard.

**REQ-MB05** — Rotating the draw bolt clockwise (as viewed from the user side) shall draw the corresponding oarlock rod's end-nut inward, pulling the keyboard half into butterfly rotation. The thread pitch shall provide at least 1° of butterfly angle change per full bolt turn.

**REQ-MB06** — The draw bolt and grip cylinder shall be recessed into the keyboard frame so they do not protrude above the keycap surface or below the bottom plate by more than 2 mm.

**REQ-MB07** — Fold-to-close shall be achieved by disconnecting the oarlock rods from the eyes (magnetic or pull-apart), per REQ-M04.

### Strengths

- Continuous butterfly adjustment (no discrete steps).
- No custom precision parts needed — standard threaded rod and nuts.
- Draw bolt is protected inside the keyboard body.

### Weaknesses

- Threaded draw bolt is slow to adjust (many turns for meaningful angle change).
- Rod-through-eye has inherent clearance/play — may rattle.
- Relies on thread friction to hold butterfly angle — may drift under sustained typing force on a lap.
- Two independent draw bolts (one per half) must be adjusted symmetrically by the user — no mechanical guarantee of symmetry.
- More complex assembly: 2 eyes, 2 rods, 2 draw bolts, 4 stopper nuts.

---

## Mechanism C — Gimbal

### Description

A gimbal ring system provides two perpendicular rotation axes at the center junction. The outer ring handles the fold axis (belly-to-screen); the inner ring handles the butterfly axis. Each axis has its own thumb screw for independent locking. The keyboard halves attach to the inner ring via bracket arms.

### Requirements

**REQ-MC01** — An outer gimbal ring (metal, ~28 mm outer diameter) shall provide the fold rotation axis. The ring shall be oriented so its axis of rotation is along the belly-to-screen direction (Z).

**REQ-MC02** — An inner gimbal ring (metal, ~20 mm outer diameter) shall be mounted inside the outer ring, providing the butterfly rotation axis. The inner ring's axis shall be perpendicular to the outer ring's axis.

**REQ-MC03** — Each ring shall have a thumb screw (knurled metal, ≥8 mm head diameter) that locks rotation on that axis by friction clamping against the ring's bearing surface.

**REQ-MC04** — The outer ring shall be connected to the keyboard frame via pins or brackets along the Z axis. The inner ring shall connect to the two keyboard halves via bracket arms along the X axis.

**REQ-MC05** — Fold-to-close shall be achieved by disconnecting the bracket arms from the keyboard halves (magnetic breakaway) per REQ-M04, or by loosening the fold thumb screw and rotating through 180°.

### Strengths

- Continuous adjustment on both axes.
- Standard machining — no custom teeth or couplings.
- Compact: entire mechanism fits in a ~30 mm diameter envelope.

### Weaknesses

- Two separate lock/unlock operations required to adjust both angles.
- Friction-based locking on both axes — may drift under typing force on a lap (fails REQ-M07 without very high clamping force).
- No repeatable positions — angle must be eyeballed each time.
- Thumb screws protrude and may snag during transport.

---

## Mechanism D — Ball Joint + Cam Lever

### Description

A ball-and-socket joint at the center junction provides both rotation axes simultaneously. A cam lever (bicycle quick-release style) provides fast lock/unlock: flip the lever open, position both angles, flip closed. The ball is clamped between two socket halves, one attached to each keyboard half.

### Requirements

**REQ-MD01** — A metal ball (≥20 mm diameter) shall be mounted at the center junction, captured between two socket halves. The ball shall allow rotation around both the fold and butterfly axes simultaneously.

**REQ-MD02** — Each socket half shall be attached to one keyboard half via a bracket arm. The socket shall be lined with a high-friction material (e.g., nylon, PTFE, or rubber O-ring) to prevent angle drift when clamped.

**REQ-MD03** — A cam lever shall clamp the two socket halves together. The lever shall be operable with one hand: flip open to unlock both axes, reposition, flip closed to lock.

**REQ-MD04** — The cam lever shall generate sufficient clamping force (≥20 N axial) to prevent angle drift under key-press force per REQ-M07.

**REQ-MD05** — A clamp bolt shall pass through the ball center (along the Z axis), with the cam lever at one end and an adjusting nut at the other. The adjusting nut sets the baseline clamp tension.

**REQ-MD06** — Fold-to-close shall be achieved by loosening the cam lever and rotating through 180° (if the socket allows full rotation), or by magnetic breakaway disconnect per REQ-M04.

### Strengths

- Fastest adjustment: one lever, both axes at once.
- No discrete steps — infinite resolution on both axes.
- Simplest mechanism: ball, 2 socket halves, 1 bolt, 1 cam lever.
- Standard parts (ball bearings, cam levers are commodity items).

### Weaknesses

- Friction-only locking — the weakest hold of all four mechanisms. May drift on a lap under sustained typing.
- No repeatable positions — must re-find the angle each time.
- Ball surface wears over time, reducing friction — locking degrades with use.
- Adjusting one axis may inadvertently shift the other (axes are coupled through the ball).

---

## Comparison Matrix

| Criterion | A: Hirth | B: Oarlock | C: Gimbal | D: Ball+Cam |
|---|---|---|---|---|
| Fold lock method | Turnbuckle length | Cable tension | Thumb screw friction | Cam clamp friction |
| Butterfly lock method | Hirth teeth (positive) | Thread friction | Thumb screw friction | Cam clamp friction |
| Lap rigidity (REQ-M07) | Strong | Weak | Weak | Weak |
| Adjustment speed | Medium (1 nut) | Slow (many turns) | Slow (2 screws) | Fast (1 lever) |
| Repeatability | Exact (tooth positions) | None | None | None |
| Axes decoupled | Yes | Yes | Yes | No |
| Custom parts needed | Hirth discs | None | None | None |
| Fold-to-close | Magnetic disconnect | Rod disconnect | Disconnect or rotate | Rotate or disconnect |
| Estimated weight | 30–45 g | 35–50 g | 25–35 g | 20–30 g |

---

## Recommendation

**Mechanism A (Turnbuckle + Hirth)** is recommended. It is the only mechanism that provides positive (non-friction) locking on both axes, which is critical for lap use. The discrete butterfly steps (5° or 3°) are sufficient — most users settle on 1–2 preferred angles. The Hirth discs are the only custom part, available from TEDISA (from 50 mm) or TAC Rockford.

Recommended Hirth specification: **72 teeth (5° resolution) at 60 mm diameter**, or **120 teeth (3° resolution) at 80 mm diameter**. Both are within standard manufacturing range, with tooth widths of 2.1–2.6 mm (robust for daily use).
