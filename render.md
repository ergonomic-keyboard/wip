# 3D Rendering

## Install

```bash
# KiCad (PCB 3D viewer) — use pcbnew to open .kicad_pcb files
sudo apt install kicad

# FreeCAD (via snap — not in apt on some distros)
sudo snap install freecad

# STL viewers (any of these work)
sudo apt install meshlab
# or
sudo snap install prusa-slicer
```

macOS:
```bash
brew install --cask kicad freecad meshlab
```

## View the PCB in 3D (KiCad)

```bash
cd /home/a/git/git/keyboard/wip
export CHERRY_MX_ULP_DIR=$(realpath ../Cherry_MX_ULP/Cherry_ULP.pretty)
pcbnew builds/<name>/pcbs/keyboard_v7.kicad_pcb
```

Then: **View → 3D Viewer** — shows the PCB with Cherry ULP switch STEP models.

Note: use `pcbnew`, not `kicad`. Use the `_v7` file for KiCad 7+.

## View cases/plates as STL

The STL files are generated automatically by `generate.sh`. View them with:

```bash
meshlab builds/<name>/cases/switch_plate.stl
meshlab builds/<name>/cases/bottom_plate.stl
meshlab builds/<name>/cases/wooden_frame.stl
```

Or drag into any online STL viewer: https://www.viewstl.com/

## View cases (JSCAD v1 browser viewer)

The `.jscad` files use OpenJSCAD v1 API. Paste contents into:

https://3d.hrg.hr/jscad/V1/

## View outlines (FreeCAD)

```bash
freecad builds/<name>/outlines/board.dxf
```

Use Part → Extrude to give thickness:
- board.dxf → 1.5mm (switch plate)
- frame.dxf → 5mm (wooden frame)

## View SVG outlines (browser, no install)

```bash
xdg-open builds/<name>/outlines/board.svg
xdg-open builds/<name>/outlines/switch_cutouts.svg
xdg-open builds/<name>/outlines/frame.svg
```

## Generated files summary

| File | Format | Viewer |
|------|--------|--------|
| `pcbs/keyboard_v7.kicad_pcb` | KiCad 7 | `pcbnew` |
| `pcbs/keyboard.kicad_pcb` | KiCad 5 (legacy) | older KiCad |
| `cases/*.stl` | STL | meshlab, viewstl.com, any slicer |
| `cases/*.jscad` | OpenJSCAD v1 | 3d.hrg.hr/jscad/V1/ |
| `outlines/*.dxf` | DXF | FreeCAD, any CAD |
| `outlines/*.svg` | SVG | any browser |
