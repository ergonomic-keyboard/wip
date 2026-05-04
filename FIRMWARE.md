# Firmware

## ZMK (recommended for wireless)

ZMK is the firmware for the nice!nano controller. No build tools needed — use GitHub Actions.

### Setup

1. Fork https://github.com/zmkfirmware/unified-zmk-config-template
2. Edit `config/boards/shields/keyboard/keyboard.keymap` with your keymap
3. Push to GitHub — Actions will build the firmware .uf2 files
4. Download the .uf2 artifacts

### Flashing

1. Double-tap reset on the nice!nano (enters bootloader)
2. It appears as a USB drive
3. Drag the .uf2 file onto the drive
4. Done — keyboard is running

### Features

- Bluetooth 5.0 (connect to 5 devices)
- USB-C wired mode
- Split keyboard support (wireless between halves)
- Battery management built-in
- Deep sleep for battery life

## QMK (alternative, wired only)

If using a Pro Micro compatible wired controller instead of nice!nano:

1. Clone https://github.com/qmk/qmk_firmware
2. Create keyboard definition under `keyboards/`
3. `qmk compile -kb keyboard -km default`
4. Flash with `qmk flash`

## Keymap

The default keymap uses 36 keys (3x5 + 3 thumb per half). Customize layers in the ZMK config:

- Layer 0: QWERTY (or your preferred alpha layout)
- Layer 1: Numbers + symbols (hold thumb key)
- Layer 2: Navigation + function keys (hold other thumb key)

## Testing with native_posix (hardware emulation)

The wizard (step 4) generates a complete ZMK shield definition and test suite. Tests use ZMK's `native_posix_64` framework — firmware compiles to a native Linux binary and runs simulated key events. No QEMU or physical hardware required.

### Prerequisites

- Docker (for self-contained build environment)

### Running tests

Download the ZIP from step 3 or step 4 of the wizard, then:

```bash
cd zmk
chmod +x run_tests.sh
./run_tests.sh
```

This builds the firmware inside a Docker container and runs three test suites:

1. **all-keys-register** — presses every key position sequentially, verifies each produces the correct HID keycode
2. **layer-switch** — holds a thumb key, presses an alpha key, verifies the alternate layer keycode
3. **matrix-ghosting** — presses two keys on the same row simultaneously, verifies no ghost keys

### Interpreting results

Each test compares actual HID keycode output against an expected snapshot. If a test fails, the diff shows which key position produced an unexpected keycode.

```
PASS: all-keys-register
PASS: layer-switch
PASS: matrix-ghosting
=== All tests passed ===
```

### Building firmware .uf2 files

```bash
cd zmk
docker compose run build-left
docker compose run build-right
ls output/keyboard_left.uf2 output/keyboard_right.uf2
```

### Adding custom tests

Create a new directory under `zmk/tests/` with:
- `native_posix_64.keymap` — mock events using `ZMK_MOCK_PRESS(row, col, delay_ms)`
- `events.patterns` — sed patterns to filter log output
- `keycode_events.snapshot` — expected HID output
