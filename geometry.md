# Geometry Reference — Coordinate System & Named Anchors

This document defines the coordinate system used in `render3d.js` (the Three.js 3D renderer) and all named spatial anchors referenced by requirements.

---

## Coordinate System (Model/Local Space)

All geometry is built in **model space** (also called local space). A `boardRoot` group then rotates everything 180° around Z for display (R19), but all code references, bbox values, and requirements use model-space coordinates.

### Origin

The origin `(0, 0, 0)` is **not** at a board corner. X and Y origin come from ergogen's coordinate system (determined by the key layout input data). Z origin is at the table surface: `Z_BOTTOM = 0`.

### Axes

```
        Z+ (up, away from table)
        |
        |
        |
        +--------→ X+  (from pinky edge toward hinge)
       /
      /
    Y+  (along key columns, data-dependent direction)
```

| Axis | Direction (model space) | Range (typical, mm) |
|------|------------------------|---------------------|
| **X** | From outer pinky edge (`bbox.min.x`) toward the hinge center (`hingeX = bbox.max.x`). Positive X points inward toward the hinge. | ~0 to ~120 (depends on layout) |
| **Y** | Along the key columns (row direction). Sign depends on ergogen output + the `y = -pt.y` negation in entry construction. `bbox.min.y` and `bbox.max.y` span the rows. | ~-60 to ~60 (depends on layout) |
| **Z** | Perpendicular to the table surface. Z = 0 is the bottom of the bottom plate (table contact). Z increases upward through the layer stack toward the keycaps. | 0 to ~8.3 |

### Display Transform (boardRoot)

For the user-facing camera view (R19: thumbs face the user), all geometry is wrapped in:

```javascript
boardRoot.rotation.z = Math.PI;  // 180° rotation around Z
```

This means:
- **Screen X** = `-model_X` (hinge appears at screen-left, pinky at screen-right)
- **Screen Y** = `-model_Y` (thumbs appear closest to the camera/user)
- **Screen Z** = `model_Z` (unchanged — up is still up)

### Right Half Mirroring

The right half is **not** a rotation. It is a mirror of the left half around the hinge line `X = hingeX`:

```javascript
rightContent.translate(-hingeX, 0, 0);
rightContent.scale(-1, 1, 1);   // mirror X
rightContent.translate(hingeX, 0, 0);
```

Both halves share the same Y range and Z range. The right half's pinky edge is at `X = 2 * hingeX - bbox.min.x`.

---

## Z Layer Stack

All Z values are in millimeters from the table surface.

```
Z (mm)
 8.3   ┬ Z_KEYCAP ..................... top of keycap
       │
 7.3   │ Z_STEM ....................... top of switch stem
       │
 4.8   ┼ Z_SWITCH_PLATE_TOP ........... top of switch plate (= Z_SWITCH_BASE)
       │ T_SWITCH_PLATE = 1.2mm
 3.6   ┼ Z_SWITCH_PLATE ............... bottom of switch plate
       │ T_CORK_UPPER = 0.5mm
 3.1   ┼ Z_CORK_UPPER = Z_PCB_TOP ..... top of PCB / bottom of upper cork
       │ T_PCB = 1.6mm
 1.5   ┼ Z_PCB ........................ bottom of PCB / top of lower cork
       │ T_CORK_LOWER = 0.5mm
 1.0   ┼ Z_CORK_LOWER ................. bottom of lower cork / top of bottom plate
       │ T_BOTTOM_PLATE = 1.0mm
 0.0   ┴ Z_BOTTOM ..................... table surface (bottom of bottom plate)
```

Total stack height (excluding keycaps): `T_FRAME = 4.8mm`

---

## Named Anchors (Left Half)

These are the spatial reference points used throughout requirements and code. All values are in model space (mm).

### X-Axis Anchors

| Anchor | Code | Meaning |
|--------|------|---------|
| **Outer pinky edge** | `bbox.min.x` | Leftmost extent of the board outline (outer perimeter of the left half). Board edge fillet starts here. |
| **Half center X** | `halfCenterX = (bbox.min.x + hingeX) / 2` | X midpoint of the left half's board outline. |
| **Hinge line** | `hingeX = bbox.max.x` | Inner edge of the left half. The fold/butterfly pivot axis passes through this X value. |
| **Right half pinky edge** | `2 * hingeX - bbox.min.x` | Mirror of `bbox.min.x` on the right side. |

### Y-Axis Anchors

| Anchor | Code | Meaning |
|--------|------|---------|
| **Board Y min** | `bbox.min.y` | Bottom extent of board outline (Y direction). |
| **Board Y center** | `center.y = (bbox.min.y + bbox.max.y) / 2` | Y midpoint of the board. Also `halfCenterY` and `hingeCenterY`. |
| **Board Y max** | `bbox.max.y` | Top extent of board outline. |

### Z-Axis Anchors

| Anchor | Code | Value (mm) |
|--------|------|-----------|
| **Table surface** | `Z_BOTTOM` | 0.0 |
| **Bottom plate top** | `Z_CORK_LOWER` | 1.0 |
| **PCB bottom** | `Z_PCB` | 1.5 |
| **PCB top** | `Z_PCB_TOP` | 3.1 |
| **Switch plate top** | `Z_SWITCH_PLATE_TOP` | 4.8 |
| **Keycap top** | `Z_KEYCAP` | 8.3 |

### Key Position Anchors

| Anchor | How to compute | Meaning |
|--------|---------------|---------|
| **Pinky column keys** | `leftKeys.filter(k => k.zone === 'matrix' && k.colIdx === 0)` | The 3 keys in the outermost (pinky) column |
| **Pinky inner edge X** | `Math.max(...pinkyKeys.map(k => k.x)) + keyHalfWidth` | Inside edge of pinky key footprints (toward hinge) |
| **Pinky outer edge X** | `Math.min(...pinkyKeys.map(k => k.x)) - keyHalfWidth` | Outside edge of pinky key footprints (toward board edge) |
| **Pinky Y center** | `(Math.min(...pinkyKeys.map(k => k.y)) + Math.max(...pinkyKeys.map(k => k.y))) / 2` | Y midpoint of pinky column |
| **Inner column keys** | `leftKeys.filter(k => k.zone === 'matrix' && k.colIdx === 4)` | The 3 keys in the innermost matrix column |
| **Thumb keys** | `leftKeys.filter(k => k.zone !== 'matrix')` | The 3 thumb cluster keys |

### Component Position Anchors (Current)

| Anchor | Code | Meaning |
|--------|------|---------|
| **MCU position** | `(nanoLeftX, nanoY)` | Currently at `halfCenterX, halfCenterY` — to be revised per R30-R36 |
| **Battery position** | `(battX, battY)` | Currently at `halfCenterX, halfCenterY - 18` |
| **USB-C position** | `(usbX, usbY)` | Currently at `bbox.min.x + 3.75, halfCenterY` |

---

## Diagram — Left Half Top View (Model Space)

```
  bbox.min.y
       │
       ▼
  ┌────────────────────────────────────────┐  ← bbox.min.x (outer pinky edge)
  │                                        │
  │   [pinky]  [ring]  [middle]  [index]  [inner]  │
  │   col 0    col 1   col 2     col 3    col 4    │
  │                                        │
  │              [thumb cluster]            │
  │              col 5 (zone=thumb)         │
  │                                        │
  └────────────────────────────────────────┘  ← hingeX (hinge/inner edge)
       ▲
       │
  bbox.max.y

  X increases →  (from bbox.min.x toward hingeX)
  Y increases ↓  (from bbox.min.y toward bbox.max.y)
```

Note: The exact Y direction sign depends on ergogen data. The diagram shows the conceptual layout; actual `bbox.min.y` may be at the top or bottom depending on input.

---

## 3D Scene Axis Indicator

The 3D render includes a visual XYZ axis indicator at the model-space origin `(0, 0, 0)` with:
- **Red line** = X axis (toward hinge)
- **Green line** = Y axis (along columns)
- **Blue line** = Z axis (up from table)
- Tick marks at 10mm and 100mm intervals
- Axis labels (X, Y, Z) at the positive ends
