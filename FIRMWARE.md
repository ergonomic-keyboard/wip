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
