# Custom Keyboard Generator

## Steps

### 0. Design your layout

Go to https://ergogen.xyz and design your split keyboard layout.

### 1. Save the config

```
mkdir -p input/<name>
```

Paste your config as `input/<name>/config.yaml`.

### 2. Generate

```
./generate.sh <name>
```

Output goes to `builds/<name>/` with:

- `outlines/board.dxf` — PCB outline for fabrication
- `outlines/frame.dxf` — Wooden frame outline for laser cutting
- `outlines/switch_cutouts.dxf` — Switch plate cutout pattern
- `cases/wooden_frame.jscad` — 3D model of the frame surround
- `cases/switch_plate.jscad` — 3D switch plate model
- `cases/bottom_plate.jscad` — 3D bottom plate model
- `pcbs/keyboard.kicad_pcb` — PCB with Cherry MX ULP footprints + diodes

## What's included

- **Cherry MX ULP switch footprint** — custom ergogen footprint (`footprints/cherry_ulp.js`)
- **No-solder BOM** — see `BOM.md` for full parts list and ordering guide
- **Firmware** — see `FIRMWARE.md` for ZMK wireless setup
- **Wooden frame** — frame outline generated automatically, laser-cut from 3mm hardwood
- **Tenting mount** — wire + turnbuckle + ball bearing design in BOM

## Connectivity

All supported via nice!nano v2 controller:
- USB-C wired (one half to laptop)
- USB-C split (half-to-half + one to laptop)
- Bluetooth wireless (both halves independent)
