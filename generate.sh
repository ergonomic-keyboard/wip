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

# Extract mounting hole positions from the generated YAML for use in assembly
echo "Extracting mounting hole positions..."
MH_YAML="$OUTPUT_DIR/outlines/mounting_holes.yaml"
MH_POSITIONS=""
if [ -f "$MH_YAML" ]; then
  MH_POSITIONS=$(python3 -c "
import yaml, json
with open('$MH_YAML') as f:
    data = yaml.safe_load(f)
# Walk the nested model tree to find all circle origins
positions = []
def find_circles(obj):
    if isinstance(obj, dict):
        if 'paths' in obj:
            for name, path in obj['paths'].items():
                if path.get('type') == 'circle':
                    positions.append(path['origin'])
        for v in obj.values():
            find_circles(v)
find_circles(data)
print(json.dumps(positions))
" 2>/dev/null) || MH_POSITIONS="[]"
fi

# Compute keyboard bounding box center from board DXF for tenting wire placement
# Output as OpenSCAD vector: [cx, cy, xmin, xmax, ymin, ymax]
BOARD_CENTER=$(python3 -c "
import yaml, json
with open('$OUTPUT_DIR/outlines/board.yaml') as f:
    data = yaml.safe_load(f)
xs, ys = [], []
def find_lines(obj):
    if isinstance(obj, dict):
        if 'paths' in obj:
            for name, path in obj['paths'].items():
                if path.get('type') == 'line':
                    for pt in path.get('origin', []), path.get('end', []):
                        if isinstance(pt, list) and len(pt) == 2:
                            xs.append(pt[0]); ys.append(pt[1])
        for v in obj.values():
            find_lines(v)
find_lines(data)
if xs and ys:
    print(json.dumps([(min(xs)+max(xs))/2, (min(ys)+max(ys))/2,
                       min(xs), max(xs), min(ys), max(ys)]))
else:
    print('[55, 0, -10, 120, -60, 50]')
" 2>/dev/null) || BOARD_CENTER='[55, 0, -10, 120, -60, 50]'

# Generate combined assembly OpenSCAD file
echo "Generating assembly view..."
ASSEMBLY="$OUTPUT_DIR/assembly.scad"
cat > "$ASSEMBLY" << SCADEOF
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
mh_positions = $MH_POSITIONS;

// Board bounding box [cx, cy, xmin, xmax, ymin, ymax]
board = $BOARD_CENTER;

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
        cylinder(h=3, d=4.2, \$fn=6);  // hex insert nut
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
          cylinder(h=wire_len, d=2, \$fn=16);
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
            cylinder(h=6, d=6, center=true, \$fn=24);
            cylinder(h=7, d=2.2, center=true, \$fn=16);
          }

    // Turnbuckle (M3, vertical, connecting bearing to insert nut)
    color(steel_color)
      translate([pos[0], pos[1], -12]) {
        // Vertical threaded rod
        cylinder(h=9, d=3, \$fn=16);
        // Turnbuckle body (thicker middle section)
        translate([0, 0, 3])
          cylinder(h=3, d=5, \$fn=6);
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
SCADEOF
echo "  -> assembly.scad"

# Render assembly to PNG (with tenting)
if command -v openscad &>/dev/null; then
  echo "Rendering assembly to PNG..."
  openscad "$ASSEMBLY" -o "$OUTPUT_DIR/assembly.png" \
    --camera=115,0,10,60,0,20,500 \
    --imgsize=1920,1080 \
    --colorscheme=Tomorrow 2>/dev/null \
    && echo "  -> assembly.png" || echo "  (render skipped)"

  # Also render without tenting
  echo "Rendering assembly (no tenting) to PNG..."
  openscad "$ASSEMBLY" -o "$OUTPUT_DIR/assembly_no_tenting.png" \
    -D 'show_tenting=false' \
    --camera=115,0,10,60,0,20,500 \
    --imgsize=1920,1080 \
    --colorscheme=Tomorrow 2>/dev/null \
    && echo "  -> assembly_no_tenting.png" || echo "  (render skipped)"
fi

echo ""
echo "Done. Output in: $OUTPUT_DIR/"
ls "$OUTPUT_DIR"/**/* 2>/dev/null || ls -R "$OUTPUT_DIR"
