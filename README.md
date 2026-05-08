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
