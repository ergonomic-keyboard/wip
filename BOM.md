# Bill of Materials — Phase 0

All components are no-solder. PCB is assembled by the fab house (PCBA service).

## Electronics (per keyboard = 2 halves)

| Qty | Component | Unit Price | Total | Source |
|-----|-----------|-----------|-------|--------|
| 36 | Cherry MX ULP Tactile switch | €0.90 | €32.40 | [keeb.supply](https://keeb.supply/products/cherry-mx-ulp) |
| 36 | 1N4148W SOD-123 diode | €0.02 | €0.72 | [LCSC](https://www.lcsc.com/product-detail/C81598.html) |
| 36 | ULP keycap (15x15mm) | ~€1.50 | ~€54 | Harvest from [Cherry KW X ULP](https://www.amazon.com/Cherry-Wireless-Mechanical-Keyboard-Switches/dp/B0C4HRP34X) or [AliExpress Dell module](https://www.aliexpress.com/item/1005005578673316.html) |
| 2 | nice!nano v2 | €25.00 | €50.00 | [42keebs.eu](https://42keebs.eu/shop/parts/controllers/nice-nano-v2-wireless-controller/), [splitkb.com](https://splitkb.com/products/nice-nano), [nicekeyboards.com](https://nicekeyboards.com/nice-nano/) |
| 2 | Mill-Max 315 socket strip (12-pin) | €4.00 | €16.00 | [splitkb.com](https://splitkb.com/products/mill-max-low-profile-sockets), [Arrow](https://www.arrow.com/en/products/315-43-120-41-003000/mill-max) |
| 2 | 301230 LiPo battery (110mAh) | €3.00 | €6.00 | [AliExpress](https://www.aliexpress.com/w/wholesale-301230-lipo.html) |
| 2 | MSK-12C02 power switch | €0.20 | €0.40 | [LCSC](https://www.lcsc.com/product-detail/C431541.html) |
| 1 | USB-C cable | €5.00 | €5.00 | Any |
| 2 | PCB (assembled, PCBA) | ~€15.00 | ~€30.00 | [JLCPCB](https://jlcpcb.com/pcb-assembly) |

**Phase 0 electronics total: ~€195**

## Connectivity Options

The nice!nano supports all three modes out of the box:
1. **Wired**: USB-C from one half directly to laptop
2. **Split wired**: USB-C between halves, one USB-C to laptop
3. **Wireless**: Bluetooth from both halves to laptop (no cables)

## How to Order

### PCB (JLCPCB)
1. Go to [jlcpcb.com](https://jlcpcb.com/quote)
2. Upload `builds/<name>/pcbs/keyboard.kicad_pcb` (export Gerbers from KiCad first)
3. Enable "PCB Assembly" toggle
4. Upload BOM CSV + pick-and-place CPL file
5. They solder all SMD components (switches, diodes)
6. Cost: ~€8 setup + €0.0017/joint + component cost. For 36 switches + 36 diodes ≈ €15/board

### MCU (no solder)
1. Insert Mill-Max sockets into PCB holes
2. Drop nice!nano onto sockets
3. Done — removable, no soldering

### Switches (no solder)
Cherry ULP switches clip into the alignment holes on the assembled PCB. The SMD contact pads are pre-soldered by JLCPCB during assembly.
