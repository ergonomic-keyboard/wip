#!/bin/bash
set -e

PERSON="$1"

if [ -z "$PERSON" ]; then
  echo "Usage: ./generate.sh <person_name>"
  exit 1
fi

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
INPUT_DIR="$SCRIPT_DIR/input/$PERSON"
OUTPUT_DIR="$SCRIPT_DIR/builds/$PERSON"
ERGOGEN="$SCRIPT_DIR/../ergogen/src/cli.js"
DEFAULTS="$SCRIPT_DIR/defaults.yaml"

if [ ! -d "$INPUT_DIR" ]; then
  echo "Error: $INPUT_DIR does not exist."
  echo "Create it and place your config.yaml there."
  exit 1
fi

if [ ! -f "$INPUT_DIR/config.yaml" ]; then
  echo "Error: No config.yaml found in $INPUT_DIR"
  exit 1
fi

# Merge defaults if config is missing outlines/cases/pcbs
MERGED="$INPUT_DIR/.merged.yaml"
if grep -q "^outlines:" "$INPUT_DIR/config.yaml"; then
  cp "$INPUT_DIR/config.yaml" "$MERGED"
else
  echo "Appending default outlines/cases/pcbs..."
  python3 "$SCRIPT_DIR/merge_config.py" "$INPUT_DIR/config.yaml" "$DEFAULTS" > "$MERGED"
fi

echo "Generating keyboard for: $PERSON"

rm -rf "$OUTPUT_DIR"
mkdir -p "$OUTPUT_DIR"

node "$ERGOGEN" "$MERGED" -o "$OUTPUT_DIR" --debug --svg --clean

rm -f "$MERGED"

# Convert PCB to KiCad v7 format
echo "Converting PCB to KiCad v7..."
/usr/bin/python3 -c "
import pcbnew
board = pcbnew.LoadBoard('$OUTPUT_DIR/pcbs/keyboard.kicad_pcb')
board.Save('$OUTPUT_DIR/pcbs/keyboard_v7.kicad_pcb')
" 2>/dev/null && echo "  -> keyboard_v7.kicad_pcb" || echo "  (skipped, pcbnew not available)"

# Convert JSCAD v1 to STL
echo "Converting cases to STL..."
for f in "$OUTPUT_DIR"/cases/*.jscad; do
  [ -f "$f" ] || continue
  stl="${f%.jscad}.stl"
  npx --yes @jscad/cli@1 "$f" -o "$stl" 2>/dev/null && echo "  -> $(basename "$stl")" || echo "  (skipped: $(basename "$f"))"
done

# Extract key positions from points.yaml for assembly placement
echo "Extracting key positions for assembly..."
POSITIONS=$(python3 -c "
import yaml, json
with open('$OUTPUT_DIR/points/points.yaml') as f:
    data = yaml.safe_load(f)
out = {}
for name, pt in data.items():
    out[name] = [pt['x'], pt['y'], pt.get('r', 0)]
print(json.dumps(out))
" 2>/dev/null) || POSITIONS="{}"

# Extract board bounding box [cx, cy, xmin, xmax, ymin, ymax]
BOARD_CENTER=$(python3 -c "
import yaml, json
with open('$OUTPUT_DIR/outlines/board.yaml') as f:
    data = yaml.safe_load(f)
xs, ys = [], []
def find_points(obj):
    if isinstance(obj, dict):
        if 'paths' in obj:
            for name, path in obj['paths'].items():
                if path.get('type') == 'line':
                    for pt in [path.get('origin', []), path.get('end', [])]:
                        if isinstance(pt, list) and len(pt) == 2:
                            xs.append(pt[0]); ys.append(pt[1])
        for v in obj.values():
            find_points(v)
find_points(data)
if xs and ys:
    print(json.dumps([(min(xs)+max(xs))/2, (min(ys)+max(ys))/2,
                       min(xs), max(xs), min(ys), max(ys)]))
else:
    print('[55, 0, -10, 120, -60, 50]')
" 2>/dev/null) || BOARD_CENTER='[55, 0, -10, 120, -60, 50]'

# Extract specific key positions for cables and hinge
HINGE_POS=$(python3 -c "
import json
pts = json.loads('$POSITIONS')
# Hinge between inner columns of left and right halves
# Left inner_home and right (mirror) inner_home
l = pts.get('matrix_inner_home', [80, 11, -12])
r = pts.get('mirror_matrix_inner_home', [148, 11, 12])
# Midpoint
print(json.dumps([(l[0]+r[0])/2, (l[1]+r[1])/2]))
" 2>/dev/null) || HINGE_POS='[114, 11]'

CABLE_TOP=$(python3 -c "
import json
pts = json.loads('$POSITIONS')
l = pts.get('matrix_pinky_top', [5, 38, -7])
r = pts.get('mirror_matrix_pinky_top', [224, 38, 7])
print(json.dumps([l[0], l[1], r[0], r[1]]))
" 2>/dev/null) || CABLE_TOP='[5, 38, 224, 38]'

CABLE_BOTTOM=$(python3 -c "
import json
pts = json.loads('$POSITIONS')
l = pts.get('matrix_pinky_bottom', [0, 0, -7])
r = pts.get('mirror_matrix_pinky_bottom', [228, 0, 7])
print(json.dumps([l[0], l[1], r[0], r[1]]))
" 2>/dev/null) || CABLE_BOTTOM='[0, 0, 228, 0]'

# MCU position: place nice!nano near the inner top of each half
MCU_LEFT=$(python3 -c "
import json
pts = json.loads('$POSITIONS')
p = pts.get('matrix_inner_top', [85, 30, -12])
print(json.dumps([p[0]+5, p[1]+2, p[2]]))
" 2>/dev/null) || MCU_LEFT='[90, 32, -12]'

MCU_RIGHT=$(python3 -c "
import json
pts = json.loads('$POSITIONS')
p = pts.get('mirror_matrix_inner_top', [144, 30, 12])
print(json.dumps([p[0]-5, p[1]+2, p[2]]))
" 2>/dev/null) || MCU_RIGHT='[139, 32, 12]'

# Generate combined assembly OpenSCAD file
echo "Generating assembly view..."
ASSEMBLY="$OUTPUT_DIR/assembly.scad"
cat > "$ASSEMBLY" << SCADEOF
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
board = $BOARD_CENTER;

// Key positions for cables and hinge
hinge_pos    = $HINGE_POS;
cable_top    = $CABLE_TOP;    // [lx, ly, rx, ry]
cable_bottom = $CABLE_BOTTOM;
mcu_left     = $MCU_LEFT;     // [x, y, rotation]
mcu_right    = $MCU_RIGHT;

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
              cylinder(h=2.6, d=0.64, \$fn=8);
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
          cylinder(h=0.5, d=0.8, \$fn=8);
      color(black_color)
        translate([1, 10, 1.5])
          cylinder(h=0.5, d=0.8, \$fn=8);
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
          cylinder(h=len, d=1.5, \$fn=12);

  // Turnbuckle (center of cable)
  color(steel_color)
    translate([(x1+x2)/2, (y1+y2)/2, z])
      rotate([0, 0, ang])
        rotate([0, 90, 0])
          cylinder(h=15, d=4, center=true, \$fn=16);

  // Clevis pin — left side (fixed bracket + pin)
  color(pin_color)
    translate([x1, y1, z]) {
      // Bracket (recessed into frame)
      translate([0, 0, -1.5])
        cube([6, 4, 3], center=true);
      // Pin shaft
      translate([0, 0, -2])
        cylinder(h=4, d=2.5, \$fn=12);
      // Ball detent button (top)
      color(red_color)
        translate([0, 0, 2])
          sphere(d=2, \$fn=12);
    }

  // Clevis pin — right side (quick-release)
  color(pin_color)
    translate([x2, y2, z]) {
      translate([0, 0, -1.5])
        cube([6, 4, 3], center=true);
      translate([0, 0, -2])
        cylinder(h=4, d=2.5, \$fn=12);
      color(red_color)
        translate([0, 0, 2])
          sphere(d=2, \$fn=12);
    }
}

// ---- Module: connection point marker ----
module connection_point(x, y, z, label) {
  translate([x, y, z]) {
    color(red_color, 0.7)
      difference() {
        cylinder(h=0.5, d=8, center=true, \$fn=24);
        cylinder(h=1, d=4, center=true, \$fn=24);
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
        cylinder(h=20, d=10, center=true, \$fn=32);
      // Shaft extending down for mounting
      translate([0, 0, -3])
        cylinder(h=3, d=6, \$fn=24);
    }
    // Ball (visible inside housing)
    color(bearing_color)
      sphere(d=8, \$fn=32);
    // Threaded rod stub (connects to each half)
    for (dx = [-14, 14]) {
      color(steel_color)
        translate([dx, 0, 0])
          rotate([0, 90, 0])
            cylinder(h=6, d=4, center=true, \$fn=16);
    }
    // Locking thumb nut
    color(copper_color)
      translate([0, 6, 0])
        rotate([90, 0, 0])
          cylinder(h=3, d=8, \$fn=6);
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
SCADEOF
echo "  -> assembly.scad"

# Render assembly to PNG
if command -v openscad &>/dev/null; then
  echo "Rendering assembly to PNG..."
  openscad "$ASSEMBLY" -o "$OUTPUT_DIR/assembly.png" \
    --camera=115,0,10,60,0,25,400 \
    --imgsize=1920,1080 \
    --colorscheme=Tomorrow 2>/dev/null \
    && echo "  -> assembly.png" || echo "  (render skipped)"
fi

echo ""
echo "Done. Output in: $OUTPUT_DIR/"
ls "$OUTPUT_DIR"/**/* 2>/dev/null || ls -R "$OUTPUT_DIR"
