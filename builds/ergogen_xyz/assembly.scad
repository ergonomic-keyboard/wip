// Full keyboard assembly — open in OpenSCAD
// Layer stack (bottom to top):
//   0.0mm  — wooden frame (5mm)
//   0.0mm  — bottom plate (1.2mm, inside frame)
//   1.2mm  — standoffs (3mm)
//   4.2mm  — PCB (1.6mm)
//   5.8mm  — switch plate (1.5mm, flush with frame top)

// Colors
frame_color  = [0.45, 0.30, 0.18];  // walnut
plate_color  = [0.75, 0.75, 0.75];  // aluminum
pcb_color    = [0.10, 0.35, 0.10];  // green PCB
standoff_clr = [0.85, 0.75, 0.40];  // brass

// Wooden frame
color(frame_color)
  import("cases/wooden_frame.stl");

// Bottom plate
color(plate_color, 0.8)
  import("cases/bottom_plate.stl");

// Standoffs (simplified as cylinders at mounting hole positions)
// These are placed by the assembly — adjust positions if needed
color(standoff_clr)
  translate([0, 0, 1.2])
    linear_extrude(3)
      import("outlines/mounting_holes.dxf");

// PCB (board outline extruded)
color(pcb_color)
  translate([0, 0, 4.2])
    linear_extrude(1.6)
      import("outlines/board.dxf");

// Switch plate
color(plate_color)
  translate([0, 0, 5.8])
    import("cases/switch_plate.stl");
