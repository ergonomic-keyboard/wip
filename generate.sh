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

# Generate combined assembly OpenSCAD file
echo "Generating assembly view..."
ASSEMBLY="$OUTPUT_DIR/assembly.scad"
cat > "$ASSEMBLY" << 'SCADEOF'
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
SCADEOF
echo "  -> assembly.scad"

# Also render assembly to STL if openscad is available
if command -v openscad &>/dev/null; then
  echo "Rendering assembly to PNG..."
  openscad "$ASSEMBLY" -o "$OUTPUT_DIR/assembly.png" \
    --camera=115,0,10,60,0,20,500 \
    --imgsize=1920,1080 \
    --colorscheme=Tomorrow 2>/dev/null \
    && echo "  -> assembly.png" || echo "  (render skipped)"
fi

echo ""
echo "Done. Output in: $OUTPUT_DIR/"
ls "$OUTPUT_DIR"/**/* 2>/dev/null || ls -R "$OUTPUT_DIR"
