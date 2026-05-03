# Principal Apple Keyboard Designer Review

What I'd change about this keyboard, evaluated against the standards we hold at Apple: simplicity, structural integrity, finish quality, and the principle that the best design is the one you don't notice.

## 1. The thumb cluster geometry is wrong

The 3 thumb keys fan out at -28 degrees of splay each, creating a 56-degree arc. That's too aggressive. When your thumb rests naturally, it sweeps maybe 15-20 degrees comfortably. At -28 per step, the far thumb key is rotated 68 degrees from the main matrix — your thumb has to twist unnaturally to reach it.

**Fix:** Reduce splay to -12 to -15 degrees. Increase spread slightly to compensate. Test with actual hands — the current values look like they were tuned visually in the ergogen editor, not validated against thumb kinematics.

## 2. The outline is not a clean shape

The board outline has irregular jagged edges created by ergogen's `bound: true` rectangles with `autobind: 10`. Each key creates an 18x18mm rectangle, and the binding extends them 10mm toward neighbors, producing a staircase silhouette along the perimeter. The thumb bridge rectangles (68x65mm) create additional harsh geometric intersections.

A product cannot ship looking like a union of axis-aligned rectangles.

**Fix:** After generating the board outline, run a convex hull or apply a generous fillet (8-12mm) to the perimeter. Alternatively, define the outline manually as a smooth polygon that envelops all key positions with proper curvature. The outline should feel like a single deliberate shape, not an artifact of the layout tool.

## 3. The 4mm center cut is a hack

Splitting two halves by subtracting a 4mm rectangle from a merged outline produces a sharp, straight cut line that doesn't follow the natural boundary of either half. Where the thumb bridges were overlapping, the cut creates arbitrary diagonal edges that don't correspond to any structural logic.

**Fix:** Don't merge the halves in the first place. Define `board_left` and `board_right` as independent outlines with their own smooth perimeters. Each half should be a self-contained, aesthetically complete shape. The center gap should be a consequence of them being separate objects, not a surgical cut through a merged blob.

## 4. The wooden frame adds thickness for no reason

The frame extrudes to 3.8mm (the full stack height), but it's just a border ring — it doesn't carry structural load between the layers. You have M2 screws for that. The frame is decorative trim pretending to be structure.

At 3.8mm extrusion with a 1mm wall (frame is 20mm, board is 18mm, so 1mm border), you're milling a thin walnut ring that will crack along the grain at the first drop. Walnut at 1mm wall thickness across a 200mm span is not viable.

**Fix:** Either make the frame thicker (3-4mm wall minimum) and accept it adds width, or replace the frame with a chamfered edge profile on the bottom plate itself. At this thickness, anodized aluminum with a wood-grain finish would be more honest than actual wood.

## 5. No gasket, no seal, no tolerance

The stack is: bottom plate, PCB sitting loose on top, switch plate sitting loose on top of that. There's nothing between the layers — no gasket, no foam, no tolerance compensation. The M2 screws clamp everything together, but the layers will rattle, and sound from key presses will resonate through the unsupported plate area.

**Fix:** Add a thin (0.3mm) poron or silicone gasket between the bottom plate and PCB, and between the PCB and switch plate. This dampens acoustics, prevents rattling, and provides tolerance for PCB warpage. The BOM cost is under €1.

## 6. Four mounting screws per half is insufficient

Four M2 screws at the corners of the matrix zone leave the entire center and thumb area unsupported. The switch plate spans up to 60mm between screws — for a 1.2mm plate, that's enough flex to feel spongy during typing. The thumb cluster area has zero screws.

**Fix:** Add 2-3 more mounting points: one near the thumb bridge, one at the center of each column group. Six to seven per half is the minimum for a plate this size.

## 7. The cables are a UX failure

Braided steel cables with carabiner hooks connecting the halves at the top and bottom rows. To fold the keyboard, you unclip the carabiners, fold, then wrap the cables around to hold it shut "like a rope around a diary."

This requires fine motor manipulation of small carabiner clips every time you open or close the keyboard. You will stop folding it after day two.

**Fix:** Use magnetic breakaway connectors (like MagSafe). The cable detaches with a gentle pull and snaps back when you unfold. No clips, no wrapping, no fumbling. Alternatively, use a rigid link that pivots — it folds with the keyboard and doesn't need to be detached at all.

## 8. The hinge axis is wrong

The hinge sits at the inner edge between the halves at the `inner_home` position, which is at row 2 of 3 (the home row). This means when you fold, the top row extends further than the bottom row on one side, and the keyboard doesn't fold into a symmetric package. The thumb clusters, which extend below and to the sides, will collide during folding.

**Fix:** The hinge axis needs to account for the full extent of both halves, including the thumb clusters. It should be positioned so that folding produces a compact, non-colliding package. Simulate the fold at 180 degrees and check for intersections.

## 9. The key spacing assumes standard MX, but you're using ULP

Cherry MX ULP switches have a 14.2x12.8mm footprint, but the layout uses 18x18mm key spacing (19mm pitch with 18mm key size). Standard MX pitch is 19.05mm. ULP keys are meant for tight laptop-style spacing — 15-16mm pitch. You're wasting 3-4mm between every key, making the keyboard 20% wider than it needs to be.

**Fix:** Reduce key size/pitch to 16mm or tighter. The ULP keycaps are 15x15mm per the BOM — at 19mm pitch, you have 4mm gaps between every key. That looks like a broken grid, not a keyboard. Close the gaps to 0.5-1mm.

## 10. No consideration for typing angle

The keyboard is flat. 3.8mm total height, zero degrees of tilt. Every keyboard study from the last 40 years shows that a slight negative tilt (front edge higher than back, 5-7 degrees) or positive tilt reduces wrist strain. The hinge provides tenting (left-right angle) but there's no mechanism for front-back tilt.

**Fix:** Add 1-2mm rubber feet at the front edge, or taper the bottom plate so it's thicker at the front. Even 3 degrees makes a difference.

## 11. No key labels, no legends, no visual feedback

Nowhere in the design is there provision for key legends. The keycaps are blank 15x15mm squares. For a keyboard that's supposed to be buildable by "grandma" (per the Phase 23 requirement), this is a problem.

**Fix:** Either source keycaps with legends, or design a key legend overlay/sticker sheet that ships with the kit.

## 12. The battery placement is unspecified

Two 301230 LiPo batteries are in the BOM, but there's no designated location for them in the physical design. The assembly.scad doesn't show them. The PCB doesn't have a battery footprint or mounting area. They'll just float loose inside the 1.6mm gap between the bottom plate and PCB — except that gap is exactly 0mm because the PCB sits directly on the bottom plate.

**Fix:** Designate a battery area on the PCB (typically under the MCU), add a battery connector footprint, and ensure there's physical clearance. You may need a cutout in the bottom plate or a slight recess.

## 13. The overall aesthetic is utilitarian, not considered

This keyboard looks like what it is: auto-generated geometry from a parametric tool. The outlines are staircase polygons, the thumb bridge is a giant axis-aligned rectangle, the frame is a uniform-width border, and the cut line between halves is a vertical strip subtraction.

Nothing about the shape says "this was designed." It says "this was computed."

**Fix:** After generating the functional geometry, spend a design pass smoothing every edge, adding intentional asymmetry where it serves ergonomics, and ensuring the silhouette reads as a single coherent form. The tool should generate the engineering; a human should refine the shape.

---

## Summary

The engineering fundamentals are sound — split layout, ULP switches, wireless MCU, foldable hinge. The problems are all in the details: spacing too wide for the switch type, outline too rough, insufficient mounting, missing damping, and a folding mechanism that's clever on paper but hostile in daily use. The gap between "it works in OpenSCAD" and "I'd put this on a desk at Apple Park" is mostly a finishing pass: smooth the geometry, tighten the spacing, add damping, and replace the carabiner cables with something that requires zero thought to operate.
