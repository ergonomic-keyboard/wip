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

echo ""
echo "Done. Output in: $OUTPUT_DIR/"
ls "$OUTPUT_DIR"/**/* 2>/dev/null || ls -R "$OUTPUT_DIR"
