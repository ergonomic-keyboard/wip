# 3D Rendering

## Option 1: OpenJSCAD (browser)

Open https://openjscad.xyz/ and drag in any `.jscad` file from `builds/<name>/cases/`:

- `switch_plate.jscad` — the plate with switch cutouts
- `bottom_plate.jscad` — the base plate
- `wooden_frame.jscad` — the frame surround (subtract of board from larger outline)

## Option 2: KiCad 3D Viewer

1. Open `builds/<name>/pcbs/keyboard.kicad_pcb` in KiCad
2. View → 3D Viewer
3. The Cherry ULP STEP model will render if `CHERRY_MX_ULP_DIR` environment variable points to `Cherry_MX_ULP/Cherry_ULP.pretty/`

```
export CHERRY_MX_ULP_DIR=/path/to/keyboard/Cherry_MX_ULP/Cherry_ULP.pretty
```

## Option 3: FreeCAD

1. Import the DXF outlines from `builds/<name>/outlines/`
2. Extrude them to the correct thicknesses:
   - bottom_plate: 1.2mm aluminum
   - switch_plate: 1.5mm steel/FR4
   - wooden_frame: 5mm hardwood
3. Stack them and render
