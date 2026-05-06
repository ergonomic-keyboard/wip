# Custom Keyboard Generator

A browser-based tool for designing custom split ergonomic keyboards. Tap your finger positions, preview in 3D, and get a complete bill of materials with purchase links.

## Quick Start (Browser Wizard)

The easiest way to design a keyboard is the browser-based wizard. No installation required.

```bash
cd /home/a/git/git/keyboard/wip
python3 -m http.server 8080
```

Open http://localhost:8080/wizard.html and follow the 4 steps:

1. **Tap finger positions** — place your left hand flat and tap 3 key positions per finger column (pinky through thumb)
2. **3D preview** — interactive 3D model with shadows, wooden frame enclosure, click-to-press keys, exploded view, and component labels
3. **Bill of materials** — full parts list with prices and purchase links, download design files as a ZIP
4. **Firmware & test** — generated ZMK shield files, keymap visualization, native_posix hardware emulation tests

### 3D Preview Features

- Realistic PBR materials (bamboo, cork, brushed steel, brass, FR-4 PCB with copper traces)
- Per-key Cherry MX ULP switches with keycaps, stems, and SOD-123 diodes
- Click any key to see the 1.8mm press animation
- M2 countersunk screws and brass heat-set inserts visible
- nice!nano v2 controllers with USB-C ports
- LiPo batteries with wiring
- Ball joint hinge with rod-end bearing
- Turnbuckle cables with clevis pins
- Fold angle slider (0-160 degrees)
- Toggle visibility of cables, hinge, battery

## CLI Pipeline

For advanced users or automated workflows, use the command-line pipeline.

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

- **Browser wizard** — 3-step web app: tap positions, 3D preview, BOM (`wizard.html`)
- **Cherry MX ULP switch footprint** — custom ergogen footprint (`footprints/cherry_ulp.js`)
- **No-solder BOM** — see `BOM.md` for full parts list and ordering guide
- **Firmware** — see `FIRMWARE.md` for ZMK wireless setup
- **Wooden frame** — frame outline generated automatically, laser-cut from 3mm hardwood
- **Tenting mount** — wire + turnbuckle + ball bearing design in BOM
- **3D rendering** — see `render.md` for all viewing options (browser, OpenSCAD, KiCad, STL)

## Connectivity

All supported via nice!nano v2 controller:
- USB-C wired (one half to laptop)
- USB-C split (half-to-half + one to laptop)
- Bluetooth wireless (both halves independent)
