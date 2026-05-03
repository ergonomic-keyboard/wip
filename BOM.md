# Bill of Materials

All components are no-solder. PCB is assembled by the fab house (PCBA service).

## Electronics (per keyboard = 2 halves)

| Qty | Component | Notes | Source |
|-----|-----------|-------|--------|
| 36 | Cherry MX ULP Tactile switches | SMD, placed by PCBA | [keeb.supply](https://keeb.supply/products/cherry-mx-ulp), [Reichelt](https://www.reichelt.de/de/en/cherry-mx-ultra-low-profile-rgb-pushbutton-module-cherry-mx6c-k3nb-p335040.html) |
| 36 | 1N4148W SOD-123 diodes | SMD, placed by PCBA | Any electronics supplier |
| 36 | Keycaps (Cherry ULP compatible) | 15x15mm, harvest from Corsair K100 Air or Cherry KW X ULP | See Cherry_MX_ULP/README.md |
| 2 | nice!nano v2 (or compatible) | Wireless MCU, USB-C, drop-in Pro Micro footprint | [nicekeyboards.com](https://nicekeyboards.com/nice-nano/) |
| 2 | Mill-Max 315 sockets (24 pins each) | Hotswap MCU sockets, no soldering | [Mill-Max](https://www.mill-max.com/) |
| 2 | 301230 LiPo battery (110mAh) | For wireless operation | AliExpress/Amazon |
| 2 | MSK-12C02 power switch | On/off for battery | LCSC |
| 1 | USB-C to USB-C cable | Half-to-half or half-to-laptop | Any |
| 2 | USB-C breakout boards | One per half, for charging/data | AliExpress |
| 2 | PCBs (assembled) | Order from JLCPCB/PCBWay with PCBA service | Upload keyboard.kicad_pcb |

## Connectivity Options

The nice!nano supports all three modes:
1. **Wired**: USB-C from one half to laptop
2. **Split wired**: USB-C between halves, one USB-C to laptop
3. **Wireless**: Bluetooth from both halves to laptop (no cables needed)

## Tenting Mount (per half)

| Qty | Component | Notes | Source |
|-----|-----------|-------|--------|
| 2 | M3 turnbuckle (50mm body) | Stainless steel | AliExpress/McMaster-Carr |
| 2 | M3 threaded rod end (ball joint) | Attaches turnbuckle to keyboard frame | McMaster-Carr |
| 1 | 8mm steel ball bearing | Weight/pivot between the two wires | Any bearing supplier |
| 2 | M3 threaded insert | Press-fit into wooden frame bottom | Amazon |
| 2 | Stainless steel wire (1.5mm dia, ~80mm) | From frame insert to turnbuckle | Hardware store |

## Wooden Frame (per half)

| Qty | Component | Notes |
|-----|-----------|-------|
| 1 | 3mm hardwood sheet (walnut/maple) | Laser cut using frame.dxf outline |
| 4 | M2 brass standoffs (3mm height) | PCB mounting to frame |
| 8 | M2x4 screws | Secure PCB to standoffs |

## Ordering Notes

1. **PCB**: Upload `keyboard.kicad_pcb` to JLCPCB. Select PCBA (assembly) service. Upload BOM and pick-and-place files. They solder everything.
2. **Frame**: Send `frame.dxf` to a laser cutting service (Ponoko, SendCutSend) or cut yourself.
3. **MCU**: The nice!nano drops into Mill-Max sockets on the PCB — no soldering needed.
4. **Switches**: Cherry ULP switches snap into the PCB alignment holes — no soldering (SMD pads are pre-soldered by PCBA).
