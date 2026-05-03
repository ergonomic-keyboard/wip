# Principal Apple Keyboard Designer Review

What I'd change about this keyboard, evaluated against the standards we hold at Apple: simplicity, structural integrity, finish quality, and the principle that the best design is the one you don't notice.

## 1. The thumb cluster geometry is wrong

The 3 thumb keys fan out at -28 degrees of splay each, creating a 56-degree arc. That's too aggressive. When your thumb rests naturally, it sweeps maybe 15-20 degrees comfortably. At -28 per step, the far thumb key is rotated 68 degrees from the main matrix — your thumb has to twist unnaturally to reach it.

**Ignore:** This will be decided by the user later.

## 2. The outline is not a clean shape

The board outline has irregular jagged edges created by ergogen's `bound: true` rectangles with `autobind: 10`. Each key creates an 18x18mm rectangle, and the binding extends them 10mm toward neighbors, producing a staircase silhouette along the perimeter. The thumb bridge rectangles (68x65mm) create additional harsh geometric intersections.

A product cannot ship looking like a union of axis-aligned rectangles.

**Fix:** After generating the board outline, run a convex hull or apply a generous fillet (8-12mm) to the perimeter. Alternatively, define the outline manually as a smooth polygon that envelops all key positions with proper curvature. The outline should feel like a single deliberate shape, not an artifact of the layout tool. (A combination, I think it should be index point left side straight. Then ark with radius depending on angle between pointy finger and pinkey finger, then pinky finger right side straight. Then bottom also an ark but smaller, I don't know what aesthetic geometry would be there. Then a fillet/border of 8 to 12 mm around the thumb keys.

## 3. The 4mm center cut is a hack

Splitting two halves by subtracting a 4mm rectangle from a merged outline produces a sharp, straight cut line that doesn't follow the natural boundary of either half. Where the thumb bridges were overlapping, the cut creates arbitrary diagonal edges that don't correspond to any structural logic.

**Proposed Fix:** Don't merge the halves in the first place. Define `board_left` and `board_right` as independent outlines with their own smooth perimeters. Each half should be a self-contained, aesthetically complete shape. The center gap should be a consequence of them being separate objects, not a surgical cut through a merged blob. 
**ACtual fix** In essence I agree, but the shape has already been specified in the previous code, and I don't want to complicate the code of the repo, and just keep it as it is, so ignore this).

## 4. The wooden frame adds thickness for no reason

The frame extrudes to 3.8mm (the full stack height), but it's just a border ring — it doesn't carry structural load between the layers. You have M2 screws for that. The frame is decorative trim pretending to be structure.

At 3.8mm extrusion with a 1mm wall (frame is 20mm, board is 18mm, so 1mm border), you're milling a thin walnut ring that will crack along the grain at the first drop. Walnut at 1mm wall thickness across a 200mm span is not viable.

**Proposed Fix:** Either make the frame thicker (3-4mm wall minimum) and accept it adds width, or replace the frame with a chamfered edge profile on the bottom plate itself. At this thickness, anodized aluminum with a wood-grain finish would be more honest than actual wood.
**Question** Is it possible to make the wooden frame just 2 part (milled)? (backbone+edge,and then one piece that covers it at the top?) If so how thin could it still be? Would a different type of wood bringe more strength at low thinness? What would the direction of the fibers need to be for optimal strength?
I would like to use nuts and bolts instead of screws, I think it would be elegant if they can be sunken in somehow, is there an elegant mechanism for this?

**Answer:**

**Two-part frame: yes, viable.** Mill a bottom piece (backbone + edge lip that the PCB and bottom plate sit inside) and a top bezel piece that covers the switch plate edge. At 3.8mm total stack, each piece would be ~1.9mm. That's too thin for solid walnut, but viable in laminated materials.

**Minimum thickness by material:**

| Material | Min thickness | MOR (MPa) | Notes |
|----------|--------------|-----------|-------|
| [Bamboo plywood](https://bambooimport.com/en/pages/the-mechanical-properties-of-bamboo) | 2.0mm | 40-60 | Tensile strength ~160 N/mm², 3-4x stronger than most hardwoods. Best option for thin frames. Density 0.8-1.2 g/cm³. |
| [Baltic birch plywood](https://www.makeitfrom.com/material-properties/Bamboo-Plywood) | 3.0mm | 40-60 | Cross-grain lamination resists splitting. More consistent than bamboo. |
| Solid walnut | 3.5mm | ~25-30 | Cracks along grain at corners and thin walls below this. |
| Solid maple/beech | 3.0mm | ~35-40 | Denser, tighter grain than walnut, slightly more forgiving. |

**Recommendation: bamboo plywood at 2mm.** It has the best strength-to-thickness ratio and looks good with a natural finish.

**Fiber direction:** For a perimeter frame, cross-laminated plywood (bamboo or birch) is the only real answer — it has equal strength in all directions. If using solid wood, orient the grain along the longest span of each side, but you'll still have weak cross-grain sections at corners. Miter-joining four separate strips (each with grain running lengthwise) is stronger but more complex to mill.

**Sunken fasteners:** Use [M2 heat-set brass threaded inserts](https://partsbuilt.com/m2-heat-set-thread-insert-3mm-wide-3mm-long-4-pack/) pressed into the wood frame from the bottom with a soldering iron. Pair with [M2 countersunk flat-head screws](https://www.amazon.com/Countersunk-Socket-Screws-100-piece-Stainless/dp/B01HBFC8EW) from the top. The screw head sits flush with the surface, and the insert is invisible from outside. Brass inserts provide much stronger threads than tapping wood directly, and they're rated for hundreds of assembly cycles. Available in [assortment kits on Amazon](https://www.amazon.com/Brass-Insert-Assortment-Threaded-Inserts/dp/B0GRZRN9B5) for under €10.

## 5. No gasket, no seal, no tolerance

The stack is: bottom plate, PCB sitting loose on top, switch plate sitting loose on top of that. There's nothing between the layers — no gasket, no foam, no tolerance compensation. The M2 screws clamp everything together, but the layers will rattle, and sound from key presses will resonate through the unsupported plate area.

**Proposed Fix:** Add a thin (0.3mm) poron or silicone gasket between the bottom plate and PCB, and between the PCB and switch plate. This dampens acoustics, prevents rattling, and provides tolerance for PCB warpage. The BOM cost is under €1.
**Fix** Make it an organic and natural material.

**Answer:**

**Cork.** Natural cork is harvested from the bark of cork-oak trees, is compressible, resilient, and an excellent acoustic dampener. Available as [gasket sheet material](https://allstategasket.com/info_gasket_material_style-1168.asp) in 0.5mm and 0.8mm thicknesses. Cut to the board outline with a laser cutter or craft knife. Properties:
- Compresses ~10-15% under clamping force, compensating for PCB warpage
- Naturally anti-vibration — dampens key press sound transmission between layers
- Renewable, biodegradable, no off-gassing
- Resilient — returns to shape after compression, unlike foam which permanently deforms
- Available on [Amazon](https://www.amazon.com/cork-gasket-sheet/s?k=cork+gasket+sheet) for under €5 per A4 sheet (enough for 4+ keyboards)

**Alternative: wool felt** (0.5mm). Slightly better acoustic dampening, but compresses permanently over time. Less dimensionally stable than cork.

**Stack with cork:** bottom plate → 0.5mm cork → PCB → 0.5mm cork → switch plate. This adds 1.0mm to total height (3.8mm → 4.8mm), but eliminates rattle and significantly improves typing acoustics.

## 6. Four mounting screws per half is insufficient

Four M2 screws at the corners of the matrix zone leave the entire center and thumb area unsupported. The switch plate spans up to 60mm between screws — for a 1.2mm plate, that's enough flex to feel spongy during typing. The thumb cluster area has zero screws.

**Fix:** Add 2-3 more mounting points: one near the thumb bridge, one at the center of each column group. Six to seven per half is the minimum for a plate this size.

## 7. The cables are a UX failure

Braided steel cables with carabiner hooks connecting the halves at the top and bottom rows. To fold the keyboard, you unclip the carabiners, fold, then wrap the cables around to hold it shut "like a rope around a diary."

This requires fine motor manipulation of small carabiner clips every time you open or close the keyboard. You will stop folding it after day two.

**Proposed Fix:** Use magnetic breakaway connectors (like MagSafe). The cable detaches with a gentle pull and snaps back when you unfold. No clips, no wrapping, no fumbling. Alternatively, use a rigid link that pivots — it folds with the keyboard and doesn't need to be detached at all.
**Question** Suggest 5 mechanisms, give link to the product so I can see it visually. Can those be sunken into the keyboard/hidden? Would this erase a laptop harddisc if you pack it next to your laptop?

**Answer — Five mechanisms:**

**1. Magnetic pogo pin connectors** — Spring-loaded gold-plated pins with neodymium magnets for self-alignment. Snap together on contact, pull apart with gentle force. PCB-mountable.
- Product: [Adafruit DIY Magnetic Connector — 4 contact pins](https://www.adafruit.com/product/5358) (~$3 each)
- Also: [EDAC POGO+ series](https://www.digikey.com/en/product-highlight/e/edac/pogo-magnetic-spring-loaded-connectors) for industrial-grade option
- **Sinkable:** Yes. Solder directly to PCB edge pads, recess into a pocket in the frame. Only the flat pin surface is exposed.
- **Best for:** Data + power between halves. Self-aligning, zero fumbling.

**2. Flat flex cable (FFC) with ZIF connector** — The same ribbon cable used inside every laptop. 0.5mm thick, clips into a zero-insertion-force socket flush-mounted on the PCB.
- Product: [Molex FFC/FPC connectors](https://www.molex.com/en-us/products/connectors/ffc-fpc-connectors), [Samtec ZF5S 0.50mm ZIF connector](https://www.samtec.com/products/zf5s)
- **Sinkable:** Completely hidden. The ZIF socket sits on the PCB, the cable folds with the keyboard. Nothing protrudes.
- **Best for:** Internal wiring between halves that folds with the device. Not quick-detach — you'd open the ZIF lever to separate halves.

**3. 180-degree locking link hinge with wire channel** — A rigid folding arm that replaces BOTH the cable AND the hinge. Wires run through the hollow barrel. Locks at 0°/90°/180°.
- Product: [ANTEISI zinc alloy 180° locking hinge](https://www.amazon.com/ANTEISI-Locking-Adjustable-Desktop-Docking/dp/B0CXPD3BLY) (~$8 for 4pcs)
- **Sinkable:** Surface-mounted but low-profile (~6mm). Can be recessed into a routed channel in the frame.
- **Best for:** Eliminating cables entirely — the mechanical link IS the hinge and the wire conduit.

**4. Mill-Max Maxnetic spring-loaded connectors** — Professional PCB-mount magnetic connectors. Gold-plated spring pins, polarized magnets prevent reverse connection. 636g separation force. 1,000,000 cycle life.
- Product: [Mill-Max 878 series Maxnetic](https://www.mill-max.com/products/new/maxneticr-spring-loaded-connectors), [DigiKey listing](https://www.digikey.com/en/product-highlight/m/millmax/878-series-maxnetic-spring-loaded-connectors)
- **Sinkable:** Through-hole PCB mount. Only pin tips exposed at board edge. Magnets pull connectors into alignment from up to 12.7mm apart.
- **Best for:** The highest quality magnetic breakaway. Polarized magnets prevent misconnection. Expensive (~$5-8 per pair).

**5. Turnbuckle cable with quick-release pin** — Keep the current cable concept but replace carabiner hooks with [quick-release clevis pins](https://www.amazon.com/s?k=quick+release+clevis+pin+small). A spring-loaded ball detent holds the pin in place; press the button to release instantly. One-handed operation.
- **Sinkable:** The clevis bracket can be recessed into the frame edge. Only the pin head is visible.
- **Best for:** If you want to keep adjustable-length cables (for tenting angle), but need faster connect/disconnect than carabiners.

**Would magnets erase a laptop hard drive?**

**No.** All modern laptops use SSDs, which store data electronically — [magnets have zero effect on SSDs](https://forums.tomshardware.com/threads/do-magnets-affect-ssds.2596681/). Even for legacy spinning HDDs, you'd need [>450 lbs of magnetic force in direct contact](https://www.apexmagnets.com/news-how-tos/can-a-strong-magnet-really-wipe-out-a-hard-drive/) to risk data loss. The small neodymium magnets in pogo connectors produce ~0.3T at the surface and drop to negligible levels within 2cm. [Safe distance is ~15cm for sensitive components](https://magnetstek.com/can-strong-neodymium-magnets-actually-ruin-your-valuable-electronics/), easily exceeded by packing the keyboard next to (not on top of) a laptop. Completely safe.

## 8. The hinge axis is wrong

The hinge sits at the inner edge between the halves at the `inner_home` position, which is at row 2 of 3 (the home row). This means when you fold, the top row extends further than the bottom row on one side, and the keyboard doesn't fold into a symmetric package. The thumb clusters, which extend below and to the sides, will collide during folding.

**Proposed Fix:** The hinge axis needs to account for the full extent of both halves, including the thumb clusters. It should be positioned so that folding produces a compact, non-colliding package. Simulate the fold at 180 degrees and check for intersections.
**Question** I think a ball joint would be better, though I doubt those have the sufficient range of motion. What is your suggestion?

https://www.ebay.co.uk/itm/137127842162?_trksid=p2332490.c101875.m1851&itmprp=cksum%3A13712784216276709ebc23ea400caf2dbdc6281e23db%7Cenc%3AAQALAAABAC%252BHGFxECvfjBbtkIuTGV9Kno9%252FyWlLQtUDVEUmZEtaMZlK9qmXH%252FH73yzgcTfAGm1G9Swuqpz%252FVY2vdbRieC%252FXt703HWON5DGhTJ7r21TZE%252BJRZ%252F2KAZgUGbIcEJ%252BL4JC7d%252FHamQsXDnhxmDnOgpTIy2VpT9DYkGsZzQaU%252B7a0qMfsv1AegVRNycwVTbGsa1LjNQWLwK81EMR7eQMJGAzBlz6nYRhip62EkFngBcNjkcSTYliGPo6uF83v1ieITq7GPKjFHAyZFV200se7T5CWj5mwJBc7dl1n4v4SAReZDzfxIfzz5c43NnJx3vwd87HuVWKt%252FxgUYzcqad4z7lxQ%253D%7Campid%3APLP_CLK%7Cclp%3A2332490&itmmeta=01KQQCZS2XB4F1WZ5ZT89RTVAT

**Answer:**

A ball joint gives you two degrees of freedom (fold + tilt) in one mechanism, which is elegant. The problem is range of motion: a [typical ball-and-socket joint maxes out at ~160 degrees](https://www.quora.com/A-typical-ball-and-socket-joint-has-a-movement-range-of-around-160-degrees-Are-there-any-similar-simple-compact-just-1-moving-part-joint-designs-that-can-reach-180-degrees). You need 180° for flat folding. The eBay link appears to be a rod end bearing / ball joint — these typically give 15-25° of angular misalignment, not 180° of fold.

**Three options, ranked by preference:**

**Option A: Ball joint + fold allowance (recommended).** Use a ball joint like the eBay one, but accept that it won't fold fully flat — it'll fold to ~140-160° depending on the socket depth. The remaining 20-40° gap when "folded" is actually fine — the keyboard doesn't need to be perfectly flat when closed. The ball joint gives you free tenting adjustment in all axes, lockable with a single thumb nut. The turnbuckle cables then control tension and hold the angle.

**Option B: Separate hinge + ball joint.** Use an [ANTEISI 180° locking hinge](https://www.amazon.com/ANTEISI-Locking-Adjustable-Desktop-Docking/dp/B0CXPD3BLY) for the fold axis (locks at 0/90/180°), and a small ball joint for tenting angle adjustment. This separates the two degrees of freedom: hinge handles fold, ball joint handles tilt. More complex mechanically, but gives full 180° fold.

**Option C: Single lockable swivel joint.** [JW Winco GN 784 swivel ball joints](https://www.jwwinco.com/en-us/products/3.7-Connecting-assembling-with-clamping-and-connecting-elements/Mounting-Accessories/GN-784-Aluminum-Mounting-Clamps-with-Swivel-Ball-Joint) are precision industrial joints with stepless adjustment and locking. They're aluminum, compact, and designed for exactly this kind of adjustable positioning. However, they're ~25-40mm in diameter which protrudes significantly from a 3.8mm keyboard stack.

**My suggestion: Option A.** A ball joint that gives you ~160° of fold plus free tenting. The 20° gap when folded is a reasonable tradeoff for getting adjustable tilt in a single mechanism. Pair with turnbuckle cables (as you described in Q10) to lock the tenting angle and provide structural tension. This is the simplest mechanism with the most ergonomic flexibility.

## 9. The key spacing assumes standard MX, but you're using ULP

Cherry MX ULP switches have a 14.2x12.8mm footprint, but the layout uses 18x18mm key spacing (19mm pitch with 18mm key size). Standard MX pitch is 19.05mm. ULP keys are meant for tight laptop-style spacing — 15-16mm pitch. You're wasting 3-4mm between every key, making the keyboard 20% wider than it needs to be.

**Proposed Fix:** Reduce key size/pitch to 16mm or tighter. The ULP keycaps are 15x15mm per the BOM — at 19mm pitch, you have 4mm gaps between every key. That looks like a broken grid, not a keyboard. Close the gaps to 0.5-1mm.
**FIX** Ignore, this will be decided by the user later.


## 10. No consideration for typing angle

The keyboard is flat. 3.8mm total height, zero degrees of tilt. Every keyboard study from the last 40 years shows that a slight negative tilt (front edge higher than back, 5-7 degrees) or positive tilt reduces wrist strain. The hinge provides tenting (left-right angle) but there's no mechanism for front-back tilt.

**Proposed Fix:** Add 1-2mm rubber feet at the front edge, or taper the bottom plate so it's thicker at the front. Even 3 degrees makes a difference.
**Actual fix** The cables with the turnbuckles will be used to specify the exact tilts, by rotating the halves with the ball-joint hinge in the mildde.
## 11. No key labels, no legends, no visual feedback

Nowhere in the design is there provision for key legends. The keycaps are blank 15x15mm squares. For a keyboard that's supposed to be buildable by "grandma" (per the Phase 23 requirement), this is a problem.

**Eventually Fix:** Either source keycaps with legends, or design a key legend overlay/sticker sheet that ships with the kit.

## 12. The battery placement is unspecified

Two 301230 LiPo batteries are in the BOM, but there's no designated location for them in the physical design. The assembly.scad doesn't show them. The PCB doesn't have a battery footprint or mounting area. They'll just float loose inside the 1.6mm gap between the bottom plate and PCB — except that gap is exactly 0mm because the PCB sits directly on the bottom plate.

**Fix:** Designate a battery area on the PCB (typically under the MCU), add a battery connector footprint, and ensure there's physical clearance. You may need a cutout in the bottom plate or a slight recess. Maybe get a longitudinal battery and put it in the edge along the sides.

## 13. The overall aesthetic is utilitarian, not considered

This keyboard looks like what it is: auto-generated geometry from a parametric tool. The outlines are staircase polygons, the thumb bridge is a giant axis-aligned rectangle, the frame is a uniform-width border, and the cut line between halves is a vertical strip subtraction.

Nothing about the shape says "this was designed." It says "this was computed."

**Eventual Fix:** After generating the functional geometry, spend a design pass smoothing every edge, adding intentional asymmetry where it serves ergonomics, and ensuring the silhouette reads as a single coherent form. The tool should generate the engineering; a human should refine the shape.

---

## Summary

The engineering fundamentals are sound — split layout, ULP switches, wireless MCU, foldable hinge. The problems are all in the details: spacing too wide for the switch type, outline too rough, insufficient mounting, missing damping, and a folding mechanism that's clever on paper but hostile in daily use. The gap between "it works in OpenSCAD" and "I'd put this on a desk at Apple Park" is mostly a finishing pass: smooth the geometry, tighten the spacing, add damping, and replace the carabiner cables with something that requires zero thought to operate.
