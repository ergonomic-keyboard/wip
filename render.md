# 3D Rendering & Interactive Viewer

## Install

```bash
# OpenSCAD (interactive 3D viewer for full assembly)
sudo apt install openscad

# KiCad (PCB 3D viewer) — use pcbnew to open .kicad_pcb files
sudo apt install kicad

# FreeCAD (via snap — not in apt on some distros)
sudo snap install freecad

# STL viewers (any of these work)
sudo apt install meshlab
```

macOS:
```bash
brew install --cask openscad kicad freecad meshlab
```

## Interactive 3D assembly viewer (OpenSCAD)

This is the primary way to inspect the keyboard. Open `assembly.scad` in OpenSCAD for a fully interactive 3D view with all components:

```bash
cd /home/a/git/git/keyboard/wip
openscad builds/<name>/assembly.scad
```
(Right click to move the board/frame/fixed position).

**Controls:**
- **Left-drag** — rotate
- **Right-drag** — pan
- **Scroll** — zoom
- **View → Show Edges** — see wireframe
- **View → Show Axes** — orientation reference

**Cross-section (inspect internals):**
- **View → Thrown Together** — see through transparent surfaces
- Or add `#` before any shape in the .scad file to make it transparent

**Components visible:**
- Bamboo plywood frame (warm tan, 4.8mm total height, 4mm wall)
- Bottom plate (grey, 1.0mm)
- Cork gaskets (brown, 0.5mm each) — between bottom plate/PCB and PCB/switch plate
- PCB (green, 1.6mm) — on cork gasket
- Switch plate (grey, 1.2mm) — with cutouts for Cherry ULP switches
- nice!nano MCU (green PCB with black chip) — one per half
- USB-C connectors (grey) — on the nice!nano, inner edge of each half
- 301230 LiPo battery (blue, 30x12x3mm) — along board edge near MCU
- Ball joint hinge (center, rod-end bearing with thumb nut lock)
- Two turnbuckle cables with quick-release clevis pins (top and bottom)

**Toggle components** by editing variables at the top of assembly.scad:
```
show_cables  = true;   // turnbuckle cables with clevis pins
show_hinge   = true;   // ball joint hinge
show_battery = true;   // LiPo battery
```

**Folding simulation:**

The keyboard is two separate halves connected by a hinge. You can visualize folding by changing the `fold_angle` variable:
```
fold_angle = 0;    // flat (working position)
fold_angle = 90;   // half folded
fold_angle = 160;  // fully closed for transport (ball joint limit)
```

Or use the OpenSCAD Customizer panel (**View → Hide Customizer** to toggle) — it provides a slider for `fold_angle` from 0 to 160.

**Connection points:**

When `fold_angle = 0` (flat), red ring markers show where the two halves connect:
- 2 markers at the hinge (left and right mounting flanges)
- 4 markers at cable attachment points (top-left, top-right, bottom-left, bottom-right)

The assembly.scad regenerates automatically when you re-run `generate.sh`. Keeping OpenSCAD open and pressing F5 reloads the file.

A pre-rendered `assembly.png` is also generated if OpenSCAD is installed.

## View the PCB in 3D (KiCad)

```bash
cd /home/a/git/git/keyboard/wip
pcbnew builds/<name>/pcbs/keyboard_v7.kicad_pcb
```

Then: **View → 3D Viewer** — shows the PCB with component footprints.

Note: use `pcbnew`, not `kicad`. Use the `_v7` file for KiCad 7+.

## View cases/plates as STL

```bash
meshlab builds/<name>/cases/switch_plate.stl
meshlab builds/<name>/cases/bottom_plate.stl
meshlab builds/<name>/cases/wooden_frame.stl
```

Or drag into any online STL viewer: https://www.viewstl.com/

## View outlines (FreeCAD / browser)

```bash
# DXF outlines
freecad builds/<name>/outlines/board.dxf

# SVG outlines (opens in browser, no install needed)
xdg-open builds/<name>/outlines/board.svg
xdg-open builds/<name>/outlines/frame.svg
```

## View wood cutting files

```bash
freecad builds/<name>/outlines/frame_with_holes.dxf
```
This outline includes the mounting hole positions for accurate drilling.

## Generated files summary

| File | Format | Viewer | Description |
|------|--------|--------|-------------|
| `assembly.scad` | OpenSCAD | `openscad` | Interactive 3D: all components, cables, ball joint, battery, MCU |
| `assembly.png` | PNG | any image viewer | Static render of assembly |
| `pcbs/keyboard_v7.kicad_pcb` | KiCad 7 | `pcbnew` | PCB with footprints |
| `pcbs/keyboard.kicad_pcb` | KiCad 5 | older KiCad | Legacy format |
| `cases/*.stl` | STL | meshlab, viewstl.com | Individual plates/frame |
| `outlines/frame_with_holes.dxf` | DXF | FreeCAD | Wood cutting template |
| `outlines/mounting_holes.dxf` | DXF | FreeCAD | Drill positions |
| `outlines/*.svg` | SVG | any browser | 2D outlines |
