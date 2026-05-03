// Full keyboard assembly — open in OpenSCAD
// Open with: openscad assembly.scad
// Rotate, zoom, and inspect all components interactively.
//
// ---- Toggle options ----
show_cables  = true;   // turnbuckle cables with clevis pins
show_hinge   = true;   // ball joint hinge at center
show_battery = true;   // LiPo battery along edge

// ---- Fold angle ----
// 0   = flat (open, working position)
// 90  = half folded
// 160 = max fold (ball joint limit)
// Use the OpenSCAD Customizer (View → Hide Customizer to toggle)
fold_angle = 0;  // [0:5:160]

// Layer stack (bottom to top) — total 4.8mm:
//   0.0mm — bamboo frame (4.8mm, surrounds board, 4mm wall)
//   0.0mm — bottom plate (1.0mm)
//   1.0mm — cork gasket (0.5mm)
//   1.5mm — PCB (1.6mm)
//   3.1mm — cork gasket (0.5mm)
//   3.6mm — switch plate (1.2mm)
// Total assembled thickness: 4.8mm

// Colors
frame_color   = [0.82, 0.72, 0.55];  // bamboo
plate_color   = [0.75, 0.75, 0.75];  // aluminum
pcb_color     = [0.10, 0.35, 0.10];  // green PCB
cork_color    = [0.76, 0.60, 0.42];  // natural cork
steel_color   = [0.65, 0.65, 0.68];  // stainless steel
bearing_color = [0.50, 0.50, 0.55];  // bearing metal
black_color   = [0.15, 0.15, 0.15];  // black plastic
copper_color  = [0.72, 0.45, 0.20];  // copper/gold
cable_color   = [0.20, 0.20, 0.20];  // black cable
pin_color     = [0.70, 0.70, 0.72];  // steel clevis pin
red_color     = [0.85, 0.20, 0.20];  // connection point highlight
battery_color = [0.25, 0.25, 0.30];  // LiPo battery

// Board bounding box [cx, cy, xmin, xmax, ymin, ymax]
board = [119.1920064, -6.457915768651681, -9.054784797449486, 247.43879759744948, -69.98934543730336, 57.073513899999995];

// Key positions for cables and hinge
hinge_pos    = [119.1920064, 11.1102032];
cable_top    = [4.6310351, 37.7167537, 233.7529777, 37.7167537];    // [lx, ly, rx, ry]
cable_bottom = [0, 0, 238.3840128, 0];
mcu_left     = [89.6062418, 31.6950076, -12];     // [x, y, rotation]
mcu_right    = [148.77777099999997, 31.6950076, 12];

// Hinge/fold axis
hinge_x = hinge_pos[0];
hinge_y = hinge_pos[1];
hinge_z = 2.4;  // midpoint of 4.8mm stack

// ---- Module: nice!nano MCU ----
module nice_nano(pos, rot) {
  translate([pos[0], pos[1], 1.5])  // sits on cork gasket above bottom plate
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
            translate([side, -15 + i*2.54, -0.5])
              cylinder(h=2.6, d=0.64, $fn=8);
          }
      }
    }
}

// ---- Module: LiPo battery (along board edge near MCU) ----
module lipo_battery(pos, rot) {
  // 301230 LiPo: 30x12x3mm (fits along edge)
  translate([pos[0], pos[1], 1.0])
    rotate([0, 0, rot]) {
      color(battery_color)
        translate([-6, -20, 0])
          cube([12, 30, 3]);
      // Wire leads
      color(red_color)
        translate([-1, 10, 1.5])
          cylinder(h=0.5, d=0.8, $fn=8);
      color(black_color)
        translate([1, 10, 1.5])
          cylinder(h=0.5, d=0.8, $fn=8);
    }
}

// ---- Module: turnbuckle cable with clevis pins ----
module cable_with_clevis(x1, y1, x2, y2, z) {
  dx = x2 - x1;
  dy = y2 - y1;
  len = sqrt(dx*dx + dy*dy);
  ang = atan2(dy, dx);

  // Braided steel cable
  color(cable_color)
    translate([x1, y1, z])
      rotate([0, 0, ang])
        rotate([0, 90, 0])
          cylinder(h=len, d=1.5, $fn=12);

  // Turnbuckle (center of cable)
  color(steel_color)
    translate([(x1+x2)/2, (y1+y2)/2, z])
      rotate([0, 0, ang])
        rotate([0, 90, 0])
          cylinder(h=15, d=4, center=true, $fn=16);

  // Clevis pin — left side (fixed bracket + pin)
  color(pin_color)
    translate([x1, y1, z]) {
      // Bracket (recessed into frame)
      translate([0, 0, -1.5])
        cube([6, 4, 3], center=true);
      // Pin shaft
      translate([0, 0, -2])
        cylinder(h=4, d=2.5, $fn=12);
      // Ball detent button (top)
      color(red_color)
        translate([0, 0, 2])
          sphere(d=2, $fn=12);
    }

  // Clevis pin — right side (quick-release)
  color(pin_color)
    translate([x2, y2, z]) {
      translate([0, 0, -1.5])
        cube([6, 4, 3], center=true);
      translate([0, 0, -2])
        cylinder(h=4, d=2.5, $fn=12);
      color(red_color)
        translate([0, 0, 2])
          sphere(d=2, $fn=12);
    }
}

// ---- Module: connection point marker ----
module connection_point(x, y, z, label) {
  translate([x, y, z]) {
    color(red_color, 0.7)
      difference() {
        cylinder(h=0.5, d=8, center=true, $fn=24);
        cylinder(h=1, d=4, center=true, $fn=24);
      }
  }
}

// ---- Module: one keyboard half ----
module keyboard_half(side) {
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
      // Bamboo frame
      color(frame_color)
        import("cases/wooden_frame.stl");
      // Bottom plate
      color(plate_color, 0.8)
        import("cases/bottom_plate.stl");
      // Cork gasket (bottom)
      color(cork_color, 0.9)
        translate([0, 0, 1.0])
          linear_extrude(0.5)
            import("outlines/board.dxf");
      // PCB
      color(pcb_color)
        translate([0, 0, 1.5])
          linear_extrude(1.6)
            import("outlines/board.dxf");
      // Cork gasket (top)
      color(cork_color, 0.9)
        translate([0, 0, 3.1])
          linear_extrude(0.5)
            import("outlines/board.dxf");
      // Switch plate
      color(plate_color)
        translate([0, 0, 3.6])
          import("cases/switch_plate.stl");
    }
  }
  // MCU
  if (side == "left") {
    nice_nano(mcu_left, mcu_left[2]);
  } else {
    nice_nano(mcu_right, mcu_right[2]);
  }
  // Battery
  if (show_battery) {
    if (side == "left") {
      lipo_battery(mcu_left, mcu_left[2]);
    } else {
      lipo_battery(mcu_right, mcu_right[2]);
    }
  }
}

// ---- Module: ball joint hinge ----
module ball_joint_assembly() {
  translate([hinge_x, hinge_y, -2]) {
    // Rod end bearing body (housing)
    color(steel_color) {
      // Cylindrical housing
      rotate([0, 90, 0])
        cylinder(h=20, d=10, center=true, $fn=32);
      // Shaft extending down for mounting
      translate([0, 0, -3])
        cylinder(h=3, d=6, $fn=24);
    }
    // Ball (visible inside housing)
    color(bearing_color)
      sphere(d=8, $fn=32);
    // Threaded rod stub (connects to each half)
    for (dx = [-14, 14]) {
      color(steel_color)
        translate([dx, 0, 0])
          rotate([0, 90, 0])
            cylinder(h=6, d=4, center=true, $fn=16);
    }
    // Locking thumb nut
    color(copper_color)
      translate([0, 6, 0])
        rotate([90, 0, 0])
          cylinder(h=3, d=8, $fn=6);
    // Mounting plates (attach to inner edge of each half)
    for (dx = [-16, 12]) {
      color(steel_color)
        translate([dx, -5, -3])
          cube([8, 10, 2]);
    }
  }
}

// ---- Assembly with folding ----

if (fold_angle == 0) {
  keyboard_half("left");
  keyboard_half("right");

  // Connection point markers
  if (show_hinge) {
    connection_point(hinge_x - 10, hinge_y, 5.5, "hinge_L");
    connection_point(hinge_x + 10, hinge_y, 5.5, "hinge_R");
  }
  if (show_cables) {
    connection_point(cable_top[0], cable_top[1], 6, "cable_top_L");
    connection_point(cable_top[2], cable_top[3], 6, "cable_top_R");
    connection_point(cable_bottom[0], cable_bottom[1], 6, "cable_bot_L");
    connection_point(cable_bottom[2], cable_bottom[3], 6, "cable_bot_R");
  }

  // Turnbuckle cables with clevis pins (only when flat)
  if (show_cables) {
    cable_with_clevis(cable_top[0], cable_top[1],
                      cable_top[2], cable_top[3], 5.5);
    cable_with_clevis(cable_bottom[0], cable_bottom[1],
                      cable_bottom[2], cable_bottom[3], 5.5);
  }
} else {
  // Folded — rotate each half around the ball joint axis
  translate([hinge_x, 0, hinge_z])
    rotate([0, fold_angle/2, 0])
      translate([-hinge_x, 0, -hinge_z])
        keyboard_half("left");

  translate([hinge_x, 0, hinge_z])
    rotate([0, -fold_angle/2, 0])
      translate([-hinge_x, 0, -hinge_z])
        keyboard_half("right");
}

// Ball joint is always at center
if (show_hinge) {
  ball_joint_assembly();
}
