// Full keyboard assembly — open in OpenSCAD
// Toggle tenting mount visibility:
show_tenting = true;  // set to false to hide tenting mechanism

// Layer stack (bottom to top):
//   0.0mm  — wooden frame (5mm)
//   0.0mm  — bottom plate (1.2mm, inside frame)
//   1.2mm  — standoffs (3mm)
//   4.2mm  — PCB (1.6mm)
//   5.8mm  — switch plate (1.5mm, flush with frame top)
// Below frame (tenting):
//  -2.0mm  — M3 insert nuts in frame bottom
//  -7.0mm  — rod end bearings
// -12.0mm  — wire (horizontal, front-to-back)
// -17.0mm  — turnbuckles connecting bearing to wire

// Colors
frame_color    = [0.45, 0.30, 0.18];  // walnut
plate_color    = [0.75, 0.75, 0.75];  // aluminum
pcb_color      = [0.10, 0.35, 0.10];  // green PCB
standoff_clr   = [0.85, 0.75, 0.40];  // brass
steel_color    = [0.65, 0.65, 0.68];  // stainless steel
bearing_color  = [0.50, 0.50, 0.55];  // bearing metal

// Mounting hole positions (auto-extracted)
mh_positions = [[0.27765109999999993, 43.2888312], [-5.5720775, -4.353384], [90.5365383, 33.5461871], [80.556777, -13.4048977]];

// Board bounding box [cx, cy, xmin, xmax, ymin, ymax]
board = [114.19200640000001, -5.1170098054880135, -9.78600082436237, 238.17001362436238, -66.89171012771834, 56.65769051674231];

// ---- Keyboard assembly ----

// Wooden frame
color(frame_color)
  import("cases/wooden_frame.stl");

// Bottom plate
color(plate_color, 0.8)
  import("cases/bottom_plate.stl");

// Standoffs at mounting holes
color(standoff_clr)
  translate([0, 0, 1.2])
    linear_extrude(3)
      import("outlines/mounting_holes.dxf");

// PCB
color(pcb_color)
  translate([0, 0, 4.2])
    linear_extrude(1.6)
      import("outlines/board.dxf");

// Switch plate
color(plate_color)
  translate([0, 0, 5.8])
    import("cases/switch_plate.stl");

// ---- Tenting mechanism (optional) ----
if (show_tenting) {
  // M3 insert nuts pressed into frame bottom (4 positions)
  for (pos = mh_positions) {
    color(standoff_clr)
      translate([pos[0], pos[1], -3])
        cylinder(h=3, d=4.2, $fn=6);  // hex insert nut
  }

  // Two wires running front-to-back under the keyboard
  // Wire 1: under the pinky side (x ~ 25% from left)
  // Wire 2: under the index side (x ~ 75% from left)
  wire_x1 = board[2] + (board[3] - board[2]) * 0.25;  // xmin + 25%
  wire_x2 = board[2] + (board[3] - board[2]) * 0.75;  // xmin + 75%
  wire_y_front = board[4] - 5;   // ymin - 5
  wire_y_back  = board[5] + 5;   // ymax + 5
  wire_len = wire_y_back - wire_y_front;

  // Stainless steel wires (2mm diameter)
  for (wx = [wire_x1, wire_x2]) {
    color(steel_color)
      translate([wx, wire_y_front, -12])
        rotate([-90, 0, 0])
          cylinder(h=wire_len, d=2, $fn=16);
  }

  // Rod end bearings (SA3T/K) — connects wire to turnbuckle
  // Simplified as a torus-like shape at each mount point
  for (pos = mh_positions) {
    // Find nearest wire x
    nearest_wx = (abs(pos[0] - wire_x1) < abs(pos[0] - wire_x2)) ? wire_x1 : wire_x2;

    // Rod end bearing at wire level
    color(bearing_color)
      translate([nearest_wx, pos[1], -12])
        rotate([0, 90, 0])
          difference() {
            cylinder(h=6, d=6, center=true, $fn=24);
            cylinder(h=7, d=2.2, center=true, $fn=16);
          }

    // Turnbuckle (M3, vertical, connecting bearing to insert nut)
    color(steel_color)
      translate([pos[0], pos[1], -12]) {
        // Vertical threaded rod
        cylinder(h=9, d=3, $fn=16);
        // Turnbuckle body (thicker middle section)
        translate([0, 0, 3])
          cylinder(h=3, d=5, $fn=6);
      }

    // Horizontal link from turnbuckle base to bearing on wire
    color(steel_color) {
      dx = nearest_wx - pos[0];
      link_len = abs(dx);
      translate([min(pos[0], nearest_wx), pos[1] - 0.5, -12.5])
        cube([link_len, 1, 1]);
    }
  }
}
