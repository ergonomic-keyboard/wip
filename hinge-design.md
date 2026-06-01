# Hinge Mechanism Design — 6 Configurations

> Two fold hinges × three butterfly joints = six selectable configurations.

---

## 1. Architecture Overview

The hinge assembly sits at the center edge of the keyboard (X = hingeX, between R and T keys). It provides two independent rotation axes that intersect at a single **pivot center** point:

- **Fold axis (Y):** horizontal, runs belly-to-screen. Rotates halves 0°–180° (flat→closed) and beyond to 270° (tented).
- **Butterfly axis (Z):** vertical, perpendicular to table. Rotates each half ±45° (swimming-stroke wing motion).

### The Angled-Bracket Solution (from mechanism_1.png)

The pivot center must be raised above the board's top surface to allow clean 180° fold-to-close without the inner edges of the two halves colliding:

```
Board stack thickness: T_FRAME = 4.8mm (Z_BOTTOM=0 to Z_SWITCH_PLATE_TOP=4.8)

If pivot is AT the top surface (Z=4.8mm):
  The bottom edge (Z=0) of one half sweeps a 4.8mm arc.
  At 180°, the bottom edges collide — they occupy the same point.

Solution: Raise pivot by PIVOT_OFFSET above Z_SWITCH_PLATE_TOP.
  PIVOT_OFFSET = 4.0mm (provides ~3.2mm clearance at worst angle)
  Pivot center Z = Z_SWITCH_PLATE_TOP + PIVOT_OFFSET = 8.8mm

Each half connects to the pivot via an angled bracket:
  Bracket angle: α = 15° above horizontal
  Bracket arm length: L = PIVOT_OFFSET / sin(α) = 4.0 / 0.259 ≈ 15.5mm
  Horizontal reach: L × cos(α) = 15.5 × 0.966 ≈ 15.0mm

The bracket extends from the board's inner edge (X = hingeX) outward
by 15mm to reach the raised pivot. Each half has one bracket.
Total gap between halves when flat ≈ 30mm.
```

### Component Nesting Order (Z axis, bottom to top)

```
    Z = 14.8mm   ─ Thumb nut / cam lever (clamping the butterfly joint)
    Z = 13.0mm   ─ Belleville or wave washer
    Z = 12.5mm   ─ Upper butterfly disc (attached to RIGHT bracket)
    Z = 10.0mm   ─ ── teeth mesh zone ──
    Z =  9.5mm   ─ Lower butterfly disc (attached to LEFT bracket)
    Z =  8.8mm   ─ PIVOT CENTER ← fold shaft passes through here along Y
    Z =  8.0mm   ─ Fold hinge body (PHA housing or bearing yoke)
    Z =  4.8mm   ─ Z_SWITCH_PLATE_TOP (board top surface)
    Z =  0.0mm   ─ Z_BOTTOM (table)
```

The fold shaft (Y axis) passes through the central bore of both butterfly discs.
The butterfly discs rotate around Z relative to each other (constrained by teeth).
The fold shaft rotates around Y (constrained by the fold hinge mechanism).

---

## 2. Fold Hinge A: Reell PHA 8mm Friction Positioning Hinge

### Specifications

| Parameter | Value |
|-----------|-------|
| Shaft diameter | 8mm |
| Weight | 8g |
| Torque | 0.46 N·m (recommended; range 0.28–0.65) |
| Rotation | 360° continuous |
| Life | 50,000 cycles |
| Mounting | M2.5 flag-leaf screw holes |
| Body dims (est.) | 22 × 12 × 10mm (L×W×H) |

### How It Works

A wrap-spring clutch around the 8mm shaft creates constant, symmetric friction torque. The shaft rotates freely in either direction against controlled resistance. No gears, detents, or discrete stops — infinite holding positions. The flag leaf (flat mounting tab) bolts to one bracket; the shaft end inserts into a bearing seat on the other bracket.

### 3D Parts List

| # | Part | Geometry | Material | Dims (mm) |
|---|------|----------|----------|-----------|
| 1 | PHA body | Rounded box | Zinc (chrome mat) | 22×12×10 |
| 2 | PHA shaft | Cylinder along Y | Steel | Ø8 × 30 |
| 3 | Flag leaf | Thin box, 2 screw holes | Steel | 15×12×1.5 |
| 4 | Left bracket | L-shape bent at 15° | Stainless steel | 15×12×2 arm |
| 5 | Right bracket | L-shape bent at 15° | Stainless steel | 15×12×2 arm |
| 6 | M2.5 bolts ×4 | Cylinder + hex head | Steel | Ø2.5×6 |

### Weight Breakdown

| Component | Weight |
|-----------|--------|
| PHA 8mm hinge | 8g |
| Brackets (2× SS) | 10g |
| Fasteners (4× M2.5) | 2g |
| **Subtotal (fold only)** | **20g** |

---

## 3. Fold Hinge B: Miniature Sealed-Bearing Pivot

### Specifications

| Parameter | Value |
|-----------|-------|
| Pivot pin diameter | 4mm |
| Bearing | 2× MR84ZZ (4×8×3mm, sealed) |
| Rotation | 270° (limited by yoke slot) |
| Friction | Near-zero (ball bearing) |
| Mounting | Yoke bolts to right bracket; pin retained by E-clips |

### How It Works

A titanium (or stainless) 4mm pin runs through two MR84ZZ micro ball bearings pressed into the arms of a U-shaped yoke. The yoke is bolted to one half's bracket. The pin is retained by E-clips and bolted to the other half's bracket. The yoke's open slot spans 270° of arc, allowing flat→tent→closed rotation. Nearly frictionless — tenting angle is held entirely by cables.

### 3D Parts List

| # | Part | Geometry | Material | Dims (mm) |
|---|------|----------|----------|-----------|
| 1 | Pivot pin | Cylinder along Y | Titanium | Ø4 × 18 |
| 2 | MR84ZZ bearings ×2 | Torus (OD8, ID4, W3) | Chrome steel | Ø8×3 |
| 3 | Yoke | U-bracket | Stainless steel | 12×20×2 sheet |
| 4 | E-clips ×2 | Thin ring | Spring steel | Ø4 |
| 5 | Left bracket | L-shape bent at 15° | Stainless steel | 15×12×2 |
| 6 | Right bracket | L-shape bent at 15° | Stainless steel | 15×12×2 |
| 7 | M2.5 bolts ×4 | Cylinder + hex head | Steel | Ø2.5×6 |

### Weight Breakdown

| Component | Weight |
|-----------|--------|
| Pivot pin (Ti) | 0.6g |
| 2× MR84ZZ | 2.6g |
| Yoke (SS) | 4g |
| Brackets (2× SS) | 10g |
| E-clips + bolts | 2g |
| **Subtotal (fold only)** | **19g** |

---

## 4. Butterfly Joint 1: Hirth Coupling (24 teeth)

### Specifications

| Parameter | Value |
|-----------|-------|
| Outer diameter | 20mm |
| Inner bore | 9mm (clears PHA 8mm shaft + gap) |
| Tooth count | 24 |
| Angular resolution | 15° per tooth |
| Tooth profile | 60° V-groove, radially swept |
| Tooth height at OD | 2.3mm |
| Tooth height at ID | 0.7mm |
| Disc thickness | 5mm (3mm teeth + 2mm base) |
| Material | Hardened tool steel (HRC 58) |
| Weight per disc | 8g |
| Clamping | M4 thumb nut + Belleville washer |

### Tooth Geometry (computed)

```
n = 24, α = 60°
K = tan(π/2/24) / tan(60°/2) = tan(7.5°) / tan(30°) = 0.1317 / 0.5774 = 0.228
β = arcsin(0.228) = 13.17° (flank angle)

Height at r = 10mm (OD/2): h = 2 × 10 × tan(β) = 20 × 0.234 = 4.68mm
  → This is peak-to-valley. Tooth height (one side) ≈ 2.3mm

Height at r = 4.5mm (ID/2): h = 2 × 4.5 × tan(β) = 9 × 0.234 = 2.1mm
  → Tooth height at bore ≈ 1.05mm

Pitch at OD: π × 20 / 24 = 2.62mm per tooth
```

### 3D Parts

| # | Part | Geometry | Material |
|---|------|----------|----------|
| 1 | Upper Hirth disc | Cylinder + radial V-teeth on bottom face | Tool steel |
| 2 | Lower Hirth disc | Cylinder + radial V-teeth on top face | Tool steel |
| 3 | M4 clamping bolt | Cylinder through center bore | Steel |
| 4 | Belleville washer | Conical annular disc | Spring steel |
| 5 | M4 thumb nut | Knurled cylinder | Brass |

### Weight: 16g (pair) + 3g (bolt/washer/nut) = **19g**

---

## 5. Butterfly Joint 2: Curvic Coupling (36 teeth)

### Specifications

| Parameter | Value |
|-----------|-------|
| Outer diameter | 22mm |
| Inner bore | 9mm |
| Tooth count | 36 |
| Angular resolution | 10° per tooth |
| Tooth profile | Circular arc (concave/convex mating pair) |
| Tooth height at OD | 1.8mm |
| Disc thickness | 4.5mm (3mm teeth + 1.5mm base) |
| Material | 17-4PH stainless steel (case-hardened) |
| Weight per disc | 7g |
| Clamping | M4 thumb nut + Belleville washer |

### Key Difference from Hirth

Curvic teeth are ground with a circular arc profile. One disc has concave teeth, the other convex. This provides:
- Self-centering under axial load
- Higher contact area (line contact vs point contact)
- Better wear characteristics

### 3D Parts

Same assembly as BJ1 but with arc-shaped teeth instead of V-grooves.

### Weight: 14g (pair) + 3g (hardware) = **17g**

---

## 6. Butterfly Joint 3: Serrated-Face Flange (72 teeth)

### Specifications

| Parameter | Value |
|-----------|-------|
| Outer diameter | 18mm |
| Inner bore | 9mm |
| Tooth count | 72 |
| Angular resolution | 5° per tooth |
| Tooth profile | Shallow triangular, 90° included angle |
| Serration depth | 0.5mm |
| Disc thickness | 2.5mm (0.5mm teeth + 2mm base) |
| Material | 7075-T6 aluminum, hard anodized |
| Weight per disc | 3g |
| Clamping | Cam lever (quarter-turn quick-lock) |

### Key Differences

- Shallowest teeth (0.5mm vs 2.3mm Hirth) — lightest and thinnest
- Finest angular resolution (5° vs 15° Hirth)
- Aluminum instead of steel — adequate for keyboard forces
- Cam lever instead of thumb nut — faster one-handed operation

### 3D Parts

| # | Part | Geometry | Material |
|---|------|----------|----------|
| 1 | Upper serrated disc | Thin cylinder + fine radial teeth | Aluminum |
| 2 | Lower serrated disc | Thin cylinder + fine radial teeth | Aluminum |
| 3 | Cam lever | L-shape with eccentric | Steel/aluminum |
| 4 | Wave washer | Wavy annular ring | Spring steel |
| 5 | M4 bolt | Through center bore | Steel |

### Weight: 6g (pair) + 4g (lever/washer/bolt) = **10g**

---

## 7. Six Configuration Summary

| Config ID | Fold Hinge | Butterfly Joint | Total Weight | Butterfly Resolution |
|-----------|-----------|----------------|-------------|---------------------|
| `pha-hirth` | PHA 8mm friction | Hirth 24T | 20 + 19 = **39g** | 15° |
| `pha-curvic` | PHA 8mm friction | Curvic 36T | 20 + 17 = **37g** | 10° |
| `pha-serrated` | PHA 8mm friction | Serrated 72T | 20 + 10 = **30g** | 5° |
| `bearing-hirth` | Bearing pivot | Hirth 24T | 19 + 19 = **38g** | 15° |
| `bearing-curvic` | Bearing pivot | Curvic 36T | 19 + 17 = **36g** | 10° |
| `bearing-serrated` | Bearing pivot | Serrated 72T | 19 + 10 = **29g** | 5° |

All under 50g (F01.2). All metal (F01.1).

---

## 8. Mechanical Connection Detail

### How the fold hinge and butterfly joint physically connect

The fold shaft (PHA 8mm shaft or 4mm bearing pin) runs along the Y axis, passing through the central bore of both butterfly discs. The assembly stacks vertically:

```
CROSS-SECTION at pivot center (looking along Y axis):

         Z (up)
         │
    ┌────┴────┐ Thumb nut (M4, knurled brass)
    └────┬────┘
    ┌────┴────┐ Belleville washer (spring steel)
    └────┬────┘
    ╔════╧════╗
    ║ UPPER   ║ Butterfly disc — bolted to RIGHT bracket
    ║  DISC   ║ via 2× M2 ears extending beyond OD
    ║ ╲╱╲╱╲╱  ║ Teeth face DOWN
    ╠═════════╣ ← TEETH MESH PLANE (Z ≈ pivot center)
    ║ ╱╲╱╲╱╲  ║ Teeth face UP
    ║  DISC   ║ Butterfly disc — bolted to LEFT bracket
    ║ LOWER   ║ via 2× M2 ears extending beyond OD
    ╚════╤════╝
         │
    ═════●═════ ← Fold shaft/pin (along Y axis, into page)
         │       PHA body or bearing yoke sits here
    ┌────┴────┐
    │ FOLD    │ PHA body (Hinge A) or Yoke (Hinge B)
    │ HINGE   │
    └─────────┘
```

### Bracket-to-Board Attachment

```
SIDE VIEW (one half, looking along X axis):

    Board inner edge
         │
         ▼
    ┌────────────── board top Z=4.8 ──────────
    │ ┌──┐
    │ │M2│ bracket bolt #1
    │ │.5│
    │ └──┘   Bracket (2mm SS, bent at 15°)
    │    ╲
    │     ╲  15° angle
    │      ╲
    │       ╲
    │        ●──── pivot center Z=8.8
    │       ╱ ╲
    │      ╱   Butterfly disc ear (M2 bolts)
    │     ╱
    │ ┌──┐
    │ │M2│ bracket bolt #2
    │ │.5│
    │ └──┘
    │
    └────────────── board bottom Z=0 ──────────
```

### The M4 clamping system

A single M4 bolt runs vertically through the center bore of both butterfly discs, through the fold shaft (which has a cross-drilled hole for it), and threads into the thumb nut on top. The Belleville washer provides spring-loaded axial preload. When the thumb nut is tightened, the discs are squeezed together, engaging their teeth. When loosened, the discs can be rotated to a new butterfly angle.

For the serrated flange (BJ3), the M4 bolt + thumb nut is replaced by a cam lever mechanism for faster one-handed operation.

---

## 9. Fold Animation Mechanics

### Pivot Point Change

The current code uses `hingeZ = Z_SWITCH_PLATE_TOP` (4.8mm). The new design raises this:

```javascript
const PIVOT_OFFSET = 4.0; // mm above board top surface
const hingeZ = Z_SWITCH_PLATE_TOP + PIVOT_OFFSET; // = 8.8mm
```

This changes the fold pivot for `applyFold()` and `applyButterfly()`.

### Bracket Animation

When folding, the angled brackets rotate with their respective halves. The fold hinge body/yoke stays at the pivot center (it's the bearing/pivot — it doesn't move). The butterfly discs rotate with their respective brackets.

In the 3D render, each bracket and its attached butterfly disc should be parented to the appropriate half (leftHalf or rightHalf). The fold shaft/pin and hinge body stay at the center (parented to the hinge group, which doesn't fold).

### What Stays Fixed vs What Moves

| Part | Fold behavior | Parent |
|------|--------------|--------|
| Fold shaft/pin | Stays at center | hingeGroup (center) |
| PHA body / yoke | Stays at center | hingeGroup (center) |
| Left bracket | Rotates with left half | leftHalf |
| Right bracket | Rotates with right half | rightHalf |
| Lower butterfly disc | Rotates with left half | leftHalf (via bracket) |
| Upper butterfly disc | Rotates with right half | rightHalf (via bracket) |
| Thumb nut | Rotates with right half | rightHalf |
| M4 bolt | Stays at center | hingeGroup (center) |

---

## 10. Implementation Plan

### hardware-catalog.js
- Replace all old hinge entries with 2 fold hinges + 3 butterfly joints
- Add `butterflyJoint` as a new selection category
- 6 valid combinations = foldHinge × butterflyJoint
- Each entry has dims, weight, bom, and rendering metadata

### hardware-builders.js
- Delete old `buildBarrelHinge`, `buildPianoHinge`, `buildBallJointHinge`
- New builders:
  - `buildPHAHinge(dims, mats)` — PHA body + shaft + flag leaf
  - `buildBearingPivot(dims, mats)` — yoke + pin + bearings + E-clips
  - `buildBracketPair(dims, mats)` — left + right angled brackets
  - `buildHirthDiscs(dims, mats)` — upper + lower Hirth discs with teeth
  - `buildCurvicDiscs(dims, mats)` — upper + lower Curvic discs with arc teeth
  - `buildSerratedDiscs(dims, mats)` — upper + lower serrated discs
  - `buildClampAssembly(type, dims, mats)` — thumb nut or cam lever + washer + bolt
- Master `buildHardwareAssembly()` updated to compose fold + butterfly + brackets + clamp

### render3d.js
- Update `hingeZ` to include PIVOT_OFFSET
- Bracket geometry added to leftHalf/rightHalf (moves with fold)
- Center hinge parts stay in hingeGroup
- `applyFold()` and `applyButterfly()` use new pivot Z
- No change to fold/butterfly quaternion math (already correct)

### wizard.html
- Add `hw-butterfly` dropdown alongside `hw-hinge`
- Event listener to rebuild hardware on butterfly joint change
