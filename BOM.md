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

## Bamboo Plywood Frame

| Qty | Component | Unit Price | Total | Source |
|-----|-----------|-----------|-------|--------|
| 2 | Bamboo plywood sheet 200×150×2mm | €6.00 | €12.00 | [Amazon](https://www.amazon.com/s?k=bamboo+plywood+2mm), [AliExpress](https://www.aliexpress.com/w/wholesale-bamboo-plywood-2mm.html) |

Two-part milled frame per half — bottom piece (backbone + edge lip) and top bezel. Cut using `frame_with_holes.dxf` — CNC router or laser cutter. Bamboo plywood is cross-laminated (MOR 40-60 MPa), viable at 2mm thickness with 4mm wall width.

## Cork Gaskets

| Qty | Component | Unit Price | Total | Source |
|-----|-----------|-----------|-------|--------|
| 1 | Natural cork gasket sheet 0.5mm, A4 | €5.00 | €5.00 | [Amazon](https://www.amazon.com/s?k=cork+gasket+sheet+0.5mm), [AliExpress](https://www.aliexpress.com/w/wholesale-cork-gasket-sheet-0.5mm.html) |

Cut two gaskets per half from `board.dxf` outline. Placed between layers: bottom plate → cork → PCB → cork → switch plate. Eliminates rattle, dampens acoustics, compensates tolerances.

## Ball Joint Hinge

| Qty | Component | Unit Price | Total | Source |
|-----|-----------|-----------|-------|--------|
| 1 | M6 rod-end bearing (ball joint) | €3.00 | €3.00 | [AliExpress](https://www.aliexpress.com/w/wholesale-m6-rod-end-bearing.html), [eBay](https://www.ebay.com/sch/i.html?_nkw=m6+rod+end+bearing) |
| 1 | M6 thumb nut (locking) | €0.50 | €0.50 | [AliExpress](https://www.aliexpress.com/w/wholesale-m6-thumb-nut.html) |
| 2 | M6 threaded rod stub 15mm | €0.30 | €0.60 | Hardware store |
| 2 | Mounting plate (flat bracket, drilled for M2) | €1.00 | €2.00 | Hardware store or 3D-printed |

Rod-end bearing mounts at the inner edge between halves. Provides free tilt in all axes for tenting adjustment. Thumb nut locks chosen angle. Range: ~140-160° fold (not full 180° flat).

## Turnbuckle Cables with Quick-Release Clevis Pins

| Qty | Component | Unit Price | Total | Source |
|-----|-----------|-----------|-------|--------|
| 2 | Braided steel cable 1.5mm × 250mm | €0.50 | €1.00 | Hardware store or [Amazon](https://www.amazon.com/s?k=braided+steel+cable+1.5mm) |
| 2 | Small turnbuckle (M3, ~40mm body) | €1.50 | €3.00 | [AliExpress](https://www.aliexpress.com/w/wholesale-small-turnbuckle-m3.html), hardware store |
| 2 | Quick-release clevis pin (spring-loaded ball detent) | €2.50 | €5.00 | [AliExpress](https://www.aliexpress.com/w/wholesale-quick-release-clevis-pin.html), [McMaster](https://www.mcmaster.com) |
| 2 | Clevis bracket (recessed into frame edge) | €1.00 | €2.00 | Hardware store or 3D-printed |
| 4 | Cable crimp eyelet | €0.20 | €0.80 | Hardware store |

Cables serve dual purpose: structural support (prevents collapse under gravity) and tenting angle adjustment via turnbuckle length. One cable top, one bottom. Quick-release clevis pins allow one-handed press-button detach for folding.

**Phase 1 total: ~€35**

---

# Bill of Materials — Phase 2

## Assembly Hardware

| Qty | Component | Unit Price | Total | Source |
|-----|-----------|-----------|-------|--------|
| 14 | M2×5mm countersunk flat-head screw | €0.05 | €0.70 | [AliExpress](https://www.aliexpress.com/w/wholesale-m2-5mm-countersunk-screw.html), [McMaster](https://www.mcmaster.com) |
| 14 | M2 heat-set brass threaded insert | €0.15 | €2.10 | [AliExpress](https://www.aliexpress.com/w/wholesale-m2-heat-set-insert.html), [CNCKitchen](https://cnckitchen.store) |

Heat-set inserts are pressed into the bamboo frame from below using a soldering iron (set to ~200°C). Countersunk flat-head screws sit flush from the top.

**Phase 2 total: ~€2.80**

### Assembly order (per half)
1. Press M2 heat-set inserts into bottom frame piece (7 per half)
2. Place bottom plate (1.0mm) inside frame
3. Place cork gasket (0.5mm) on bottom plate
4. Place PCB on cork gasket
5. Place cork gasket (0.5mm) on PCB
6. Place switch plate (1.2mm) on cork gasket
7. Place top bezel frame piece
8. Secure from top with M2 countersunk screws into heat-set inserts (flush)
9. Press Cherry ULP switches into plate cutouts
10. Drop nice!nano onto Mill-Max sockets

Total assembled thickness: **4.8mm** (1.0 bottom + 0.5 cork + 1.6 PCB + 0.5 cork + 1.2 switch plate)

Screw positions: 7 per half — see `outlines/mounting_holes.dxf` for exact coordinates.

### Folding & cables
1. Mount ball joint at inner edge between halves, secure with mounting plates
2. Tighten thumb nut to lock ball joint at desired tenting angle
3. Attach turnbuckle cables between clevis brackets (one top, one bottom)
4. Adjust turnbuckle length to set tenting tension
5. To fold: press clevis pin buttons to release cables, fold halves inward

---

**Grand total (all phases): ~€233**
