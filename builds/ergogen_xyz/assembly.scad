// Full keyboard assembly — open in OpenSCAD
// Open with: openscad assembly.scad
// Rotate, zoom, and inspect all components interactively.
//
// ---- Toggle options ----
show_cables = true;   // horizontal cables connecting the halves
show_hinge  = true;   // lockable ball bearing hinge at center

// ---- Fold angle ----
// 0   = flat (open, working position)
// 90  = half folded
// 180 = fully closed (folded for transport)
// Use the OpenSCAD Customizer (View → Hide Customizer to toggle)
fold_angle = 0;  // [0:5:180]

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
red_color     = [0.85, 0.20, 0.20];  // connection point highlight

// Board bounding box [cx, cy, xmin, xmax, ymin, ymax]
board = [119.19200640000001, -9.23697794162884, -9.78600082436237, 248.17001362436238, -75.1316464, 56.65769051674231];

// Key positions for cables and hinge
hinge_pos    = [119.1920064, 11.1102032];
cable_top    = [4.6310351, 37.7167537, 233.7529777, 37.7167537];    // [lx, ly, rx, ry]
cable_bottom = [0, 0, 238.3840128, 0];
mcu_left     = [89.6062418, 31.6950076, -12];     // [x, y, rotation]
mcu_right    = [148.77777099999997, 31.6950076, 12];

// Hinge/fold axis
hinge_x = hinge_pos[0];
hinge_y = hinge_pos[1];
hinge_z = 1.9;  // midpoint of 3.8mm stack

// ---- Module: nice!nano MCU ----
module nice_nano(pos, rot) {
  translate([pos[0], pos[1], 1.0])
    rotate([0, 0, rot]) {
      color(pcb_color)
        translate([-9.15, -17, 0])
          cube([18.3, 34.0, 1.6]);
      color(steel_color)
        translate([-4.5, 14, 0])
          cube([9, 7.5, 3.2]);
      color(black_color)
        translate([-3.5, -5, 1.6])
          cube([7, 7, 0.8]);
      for (side = [-7.62, 7.62]) {
        color(copper_color)
          for (i = [0:11]) {
            translate([side, -15 + i*2.54, -1])
              cylinder(h=2.6, d=0.64, $fn=8);
          }
      }
    }
}

// ---- Module: cable with hooks ----
module cable_with_hook(x1, y1, x2, y2, z) {
  dx = x2 - x1;
  dy = y2 - y1;
  len = sqrt(dx*dx + dy*dy);
  ang = atan2(dy, dx);

  color(cable_color)
    translate([x1, y1, z])
      rotate([0, 0, ang])
        rotate([0, 90, 0])
          cylinder(h=len, d=1.5, $fn=12);

  color(hook_color)
    translate([x1, y1, z])
      rotate([0, 0, ang])
        difference() {
          cylinder(h=3, d=5, center=true, $fn=16);
          cylinder(h=4, d=2, center=true, $fn=16);
        }

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

// ---- Module: connection point marker ----
module connection_point(x, y, z, label) {
  translate([x, y, z]) {
    // Red ring to highlight attachment point
    color(red_color, 0.7)
      difference() {
        cylinder(h=0.5, d=8, center=true, $fn=24);
        cylinder(h=1, d=4, center=true, $fn=24);
      }
  }
}

// ---- Module: one keyboard half ----
module keyboard_half(side) {
  // side: "left" or "right"
  // Clip to left or right of center using intersection
  clip_size = 300;
  intersection() {
    if (side == "left") {
      translate([hinge_x - clip_size, -150, -50])
        cube([clip_size, 300, 100]);
    } else {
      translate([hinge_x, -150, -50])
        cube([clip_size, 300, 100]);
    }
    union() {
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
    }
  }
  // MCU
  if (side == "left") {
    nice_nano(mcu_left, mcu_left[2]);
  } else {
    nice_nano(mcu_right, mcu_right[2]);
  }
}

// ---- Module: hinge assembly ----
module hinge_assembly() {
  translate([hinge_x, hinge_y, -1]) {
    // Hinge barrel
    color(bearing_color)
      rotate([0, 90, 0])
        cylinder(h=20, d=8, center=true, $fn=32);
    // Ball bearing
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
    // Mounting flanges
    for (dx = [-14, 14]) {
      color(steel_color)
        translate([dx, -4, -1])
          cube([8, 8, 2]);
      // Screw holes in flanges
      color(black_color)
        translate([dx + 2, -2, -1.5])
          cylinder(h=3, d=2, $fn=12);
      color(black_color)
        translate([dx + 6, -2, -1.5])
          cylinder(h=3, d=2, $fn=12);
    }
  }
}

// ---- Assembly with folding ----

if (fold_angle == 0) {
  // Flat — show both halves side by side
  keyboard_half("left");
  keyboard_half("right");

  // Connection point markers (hinge + cable attachment)
  if (show_hinge) {
    connection_point(hinge_x - 10, hinge_y, 4.5, "hinge_L");
    connection_point(hinge_x + 10, hinge_y, 4.5, "hinge_R");
  }
  if (show_cables) {
    connection_point(cable_top[0], cable_top[1], 5, "cable_top_L");
    connection_point(cable_top[2], cable_top[3], 5, "cable_top_R");
    connection_point(cable_bottom[0], cable_bottom[1], 5, "cable_bot_L");
    connection_point(cable_bottom[2], cable_bottom[3], 5, "cable_bot_R");
  }

  // Cables (only when flat)
  if (show_cables) {
    cable_with_hook(cable_top[0], cable_top[1],
                    cable_top[2], cable_top[3], 4.5);
    cable_with_hook(cable_bottom[0], cable_bottom[1],
                    cable_bottom[2], cable_bottom[3], 4.5);
  }
} else {
  // Folded — rotate each half around the hinge Y-axis
  // Left half folds up by +fold_angle/2
  translate([hinge_x, 0, hinge_z])
    rotate([0, fold_angle/2, 0])
      translate([-hinge_x, 0, -hinge_z])
        keyboard_half("left");

  // Right half folds up by -fold_angle/2
  translate([hinge_x, 0, hinge_z])
    rotate([0, -fold_angle/2, 0])
      translate([-hinge_x, 0, -hinge_z])
        keyboard_half("right");
}

// Hinge is always at center (stays in place)
if (show_hinge) {
  hinge_assembly();
}
