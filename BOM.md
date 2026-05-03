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

---

# Bill of Materials — Phase 1

## Wooden Frame

| Qty | Component | Unit Price | Total | Source |
|-----|-----------|-----------|-------|--------|
| 2 | Walnut sheet 200×150×4mm | €8.00 | €16.00 | Local hardwood supplier or [Etsy](https://www.etsy.com/search?q=walnut+sheet+4mm) |

Cut using the `frame_with_holes.dxf` file — CNC router or laser cutter.

## Folding Hinge (lockable ball bearing)

| Qty | Component | Unit Price | Total | Source |
|-----|-----------|-----------|-------|--------|
| 1 | Lockable ball bearing hinge (friction hinge, 8mm barrel) | €5.00 | €5.00 | [AliExpress](https://www.aliexpress.com/w/wholesale-lockable-friction-hinge-small.html) |
| 4 | M2×6mm screw (for hinge flanges) | €0.05 | €0.20 | [AliExpress](https://www.aliexpress.com/w/wholesale-m2-6mm-screw.html) |

The hinge mounts at the inner edge between the two halves. Friction/lockable type stays at the set angle without a separate lock mechanism.

## Cables with Hooks (connects halves)

| Qty | Component | Unit Price | Total | Source |
|-----|-----------|-----------|-------|--------|
| 2 | Braided steel cable 1.5mm × 250mm | €0.50 | €1.00 | Hardware store or [Amazon](https://www.amazon.com/s?k=braided+steel+cable+1.5mm) |
| 2 | Small carabiner hook (for detachable end) | €0.80 | €1.60 | [AliExpress](https://www.aliexpress.com/w/wholesale-mini-carabiner-10mm.html) |
| 2 | Cable crimp eyelet (for fixed end) | €0.20 | €0.40 | Hardware store |

Setup: One cable runs across the top (Q-to-P row), one across the bottom (Z-to-M row). Fixed eyelet on the left side, carabiner hook on the right side for quick detach. Unclip hooks to fold keyboard closed; wrap cables around to keep it shut.

**Phase 1 total: ~€24**

---

# Bill of Materials — Phase 2

## Assembly Hardware

| Qty | Component | Unit Price | Total | Source |
|-----|-----------|-----------|-------|--------|
| 8 | M2×5mm screw (pan head) | €0.05 | €0.40 | [AliExpress](https://www.aliexpress.com/w/wholesale-m2-5mm-screw.html), [McMaster](https://www.mcmaster.com) |
| 8 | M2 nut | €0.02 | €0.16 | [AliExpress](https://www.aliexpress.com/w/wholesale-m2-nut.html) |

**Phase 2 total: ~€0.56**

### Assembly order (per half)
1. Place bottom plate (1.0mm) inside wooden frame
2. Place PCB directly on bottom plate
3. Insert M2 screws from below through all layers
4. Place switch plate (1.2mm) on top of PCB
5. Secure from top with M2 nuts
6. Press Cherry ULP switches into plate cutouts
7. Drop nice!nano onto Mill-Max sockets

Total assembled thickness: **3.8mm** (1.0 bottom + 1.6 PCB + 1.2 switch plate)

Screw positions: 4 per half at the corners — see `outlines/mounting_holes.dxf` for exact coordinates.

### Folding & cables
1. Attach hinge flanges to inner edge of each half with M2 screws
2. Clip cables between eyelets (left) and carabiner hooks (right)
3. To fold: unclip hooks, fold halves inward, wrap cables around to hold shut

---

**Grand total (all phases): ~€220**
