// Full keyboard assembly — open in OpenSCAD
// Open with: openscad assembly.scad
// Rotate, zoom, and inspect all components interactively.
//
// Toggle options:
show_cables = true;   // horizontal cables connecting the halves
show_hinge  = true;   // lockable ball bearing hinge at center

// Layer stack (bottom to top) — total 3.8mm:
//   0.0mm — wooden frame (3.8mm, surrounds board)
//   0.0mm — bottom plate (1.0mm)
//   1.0mm — PCB (1.6mm, directly on bottom plate)
//   2.6mm — switch plate (1.2mm)
// Total assembled thickness: 3.8mm

// Colors
frame_color   = [0.45, 0.30, 0.18];  // walnut
plate_color   = [0.75, 0.75, 0.75];  // aluminum
pcb_color     = [0.10, 0.35, 0.10];  // green PCB
steel_color   = [0.65, 0.65, 0.68];  // stainless steel
bearing_color = [0.50, 0.50, 0.55];  // bearing metal
black_color   = [0.15, 0.15, 0.15];  // black plastic
copper_color  = [0.72, 0.45, 0.20];  // copper/gold
cable_color   = [0.20, 0.20, 0.20];  // black cable
hook_color    = [0.70, 0.70, 0.72];  // steel hook

// Board bounding box [cx, cy, xmin, xmax, ymin, ymax]
board = [119.19200640000001, -9.23697794162884, -9.78600082436237, 248.17001362436238, -75.1316464, 56.65769051674231];

// Key positions for cables and hinge
hinge_pos    = [119.1920064, 11.1102032];
cable_top    = [4.6310351, 37.7167537, 233.7529777, 37.7167537];    // [lx, ly, rx, ry]
cable_bottom = [0, 0, 238.3840128, 0];
mcu_left     = [89.6062418, 31.6950076, -12];     // [x, y, rotation]
mcu_right    = [148.77777099999997, 31.6950076, 12];

// ---- Keyboard layers ----

// Wooden frame
color(frame_color)
  import("cases/wooden_frame.stl");

// Bottom plate
color(plate_color, 0.8)
  import("cases/bottom_plate.stl");

// PCB
color(pcb_color)
  translate([0, 0, 1.0])
    linear_extrude(1.6)
      import("outlines/board.dxf");

// Switch plate
color(plate_color)
  translate([0, 0, 2.6])
    import("cases/switch_plate.stl");

// ---- nice!nano MCU (2 units) ----
module nice_nano(pos, rot) {
  translate([pos[0], pos[1], 1.0])  // sits on bottom plate
    rotate([0, 0, rot]) {
      // PCB body: 34.0 x 18.3 x 1.6mm
      color(pcb_color)
        translate([-9.15, -17, 0])
          cube([18.3, 34.0, 1.6]);
      // USB-C connector on top edge
      color(steel_color)
        translate([-4.5, 14, 0])
          cube([9, 7.5, 3.2]);
      // MCU chip (center)
      color(black_color)
        translate([-3.5, -5, 1.6])
          cube([7, 7, 0.8]);
      // Pin headers (2 rows of 12)
      for (side = [-7.62, 7.62]) {
        color(copper_color)
          for (i = [0:11]) {
            translate([side, -15 + i*2.54, -1])
              cylinder(h=2.6, d=0.64, $fn=8);
          }
      }
    }
}

nice_nano(mcu_left, mcu_left[2]);
nice_nano(mcu_right, mcu_right[2]);

// ---- Lockable ball bearing hinge (center) ----
if (show_hinge) {
  translate([hinge_pos[0], hinge_pos[1], -1]) {
    // Hinge barrel
    color(bearing_color)
      rotate([0, 90, 0])
        cylinder(h=20, d=8, center=true, $fn=32);
    // Ball bearing inside (visible as ring)
    color(steel_color)
      rotate([0, 90, 0])
        difference() {
          cylinder(h=12, d=8.2, center=true, $fn=32);
          cylinder(h=13, d=5, center=true, $fn=32);
        }
    // Locking thumb screw
    color(steel_color)
      translate([0, 0, 5])
        cylinder(h=3, d=4, $fn=6);
    // Mounting flanges (attach to each half's inner edge)
    for (dx = [-14, 14]) {
      color(steel_color)
        translate([dx, -4, -1])
          cube([8, 8, 2]);
    }
  }
}

// ---- Cable module (must be at top level) ----
module cable_with_hook(x1, y1, x2, y2, z) {
  dx = x2 - x1;
  dy = y2 - y1;
  len = sqrt(dx*dx + dy*dy);
  ang = atan2(dy, dx);

  // Cable
  color(cable_color)
    translate([x1, y1, z])
      rotate([0, 0, ang])
        rotate([0, 90, 0])
          cylinder(h=len, d=1.5, $fn=12);

  // Hook on left side (fixed eyelet)
  color(hook_color)
    translate([x1, y1, z])
      rotate([0, 0, ang])
        difference() {
          cylinder(h=3, d=5, center=true, $fn=16);
          cylinder(h=4, d=2, center=true, $fn=16);
        }

  // Hook on right side (detachable spring hook)
  color(hook_color)
    translate([x2, y2, z])
      rotate([0, 0, ang + 180]) {
        difference() {
          cylinder(h=3, d=5, center=true, $fn=16);
          cylinder(h=4, d=2, center=true, $fn=16);
        }
        translate([0, 2, 0])
          cube([1, 3, 3], center=true);
      }
}

// ---- Horizontal cables with hooks ----
if (show_cables) {
  // Top cable (Q row to P row)
  cable_with_hook(cable_top[0], cable_top[1],
                  cable_top[2], cable_top[3], 4.5);

  // Bottom cable (Z row to M row)
  cable_with_hook(cable_bottom[0], cable_bottom[1],
                  cable_bottom[2], cable_bottom[3], 4.5);
}
