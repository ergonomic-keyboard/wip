#!/usr/bin/env python3
"""
Convert ergopad JSON output to ergogen config.yaml.

Ergopad (https://github.com/pashutk/ergopad) captures finger tap positions
on a touchscreen and exports them as JSON:

    {
      "pinky":     [{x, y}, ...],
      "ring":      [{x, y}, ...],
      "middle":    [{x, y}, ...],
      "index":     [{x, y}, ...],
      "index_far": [{x, y}, ...],
      "thumb":     [{x, y}, ...],
    }

Each column contains ~3 taps (bottom, home, top rows). This script fits a
trend line per column, derives the ergogen column parameters (spread, stagger,
splay, padding), and outputs a config.yaml for our generate.sh pipeline.

Usage:
    python3 ergopad_to_ergogen.py input.json > input/<name>/config.yaml
    python3 ergopad_to_ergogen.py input.json --name barry
    python3 ergopad_to_ergogen.py input.json --mirror-distance 22

The --name flag writes directly to input/<name>/config.yaml.
"""

import argparse
import json
import math
import sys
from pathlib import Path

import yaml


# ── Geometry helpers ────────────────────────────────────────────────

def fit_line(points):
    """Fit a line through [{x,y},...] points using least squares.

    Returns (angle_deg, center_x, center_y, distances) where:
    - angle_deg: angle of the column axis from the +Y direction (degrees),
      positive = tilted clockwise when viewed from above
    - center_x, center_y: centroid (home row position)
    - distances: list of distances between consecutive points along the axis
    """
    n = len(points)
    if n == 0:
        return 0.0, 0.0, 0.0, []
    if n == 1:
        return 0.0, points[0]["x"], points[0]["y"], []

    xs = [p["x"] for p in points]
    ys = [p["y"] for p in points]
    cx, cy = sum(xs) / n, sum(ys) / n

    # Use atan2 of the direction from first to last point (sorted by Y)
    # This is more robust than regression for near-vertical columns
    sorted_by_y = sorted(points, key=lambda p: p["y"])
    bot = sorted_by_y[0]
    top = sorted_by_y[-1]

    dx = top["x"] - bot["x"]
    dy = top["y"] - bot["y"]

    # Angle of column axis from +Y (vertical). 0 = straight up.
    # atan2(dx, dy) gives angle from +Y, positive = clockwise
    if abs(dy) < 0.01 and abs(dx) < 0.01:
        angle_deg = 0.0
    else:
        angle_deg = math.degrees(math.atan2(dx, dy))

    # Project points onto the column axis to get inter-key distances
    axis_rad = math.radians(angle_deg)
    # Unit vector along column axis: (sin(angle), cos(angle))
    ax_x = math.sin(axis_rad)
    ax_y = math.cos(axis_rad)

    projections = []
    for p in sorted_by_y:
        # Project onto axis (relative to centroid)
        proj = (p["x"] - cx) * ax_x + (p["y"] - cy) * ax_y
        projections.append(proj)

    distances = [abs(projections[i] - projections[i - 1]) for i in range(1, len(projections))]

    return angle_deg, cx, cy, distances


def ppm_to_mm(value, ppm):
    """Convert pixels (at ergopad's pixels-per-mm) to mm."""
    return value / ppm if ppm != 1.0 else value


# ── Column analysis ────────────────────────────────────────────────

def analyze_column(points):
    """Analyze a column's tap points after Y-flip (ergogen coords).
    Returns dict with center, angle (from +Y), padding, n_keys."""
    if not points:
        return None

    angle, cx, cy, distances = fit_line(points)
    padding = sum(distances) / len(distances) if distances else 18.0

    return {
        "center": (cx, cy),
        "angle": angle,       # degrees from +Y, positive = tilted right
        "padding": padding,
        "n_keys": len(points),
    }


# ── Main conversion ────────────────────────────────────────────────

MATRIX_COLUMNS = ["pinky", "ring", "middle", "index", "index_far"]
ERGOGEN_NAMES = ["pinky", "ring", "middle", "index", "inner"]


def estimate_scale(data, key_spacing=18):
    """Estimate pixels-per-mm from the data.

    Ergopad captures at screen resolution. The average inter-key distance
    should be approximately key_spacing mm. Use this to derive the scale.
    """
    all_distances = []
    for col, pts in data.items():
        if len(pts) < 2:
            continue
        _, _, _, distances = fit_line(pts)
        all_distances.extend(distances)

    if not all_distances:
        return 1.0  # no scale info, assume 1:1

    avg_px = sum(all_distances) / len(all_distances)
    if avg_px < 0.01:
        return 1.0

    return avg_px / key_spacing


def ergopad_to_ergogen(data, mirror_distance=22, key_spacing=18):
    """Convert ergopad position data to ergogen config dict.

    Ergopad coordinate system: origin top-left, Y increases downward.
    Ergogen coordinate system: Y increases upward.
    """
    # Flip Y axis (screen coords → math coords)
    flipped = {}
    for col, pts in data.items():
        flipped[col] = [{"x": p["x"], "y": -p["y"]} for p in pts]

    # Estimate scale (pixels per mm)
    ppm = estimate_scale(flipped, key_spacing)
    if ppm <= 0:
        ppm = 1.0

    # Scale all points to mm
    scaled = {}
    for col, pts in flipped.items():
        scaled[col] = [{"x": p["x"] / ppm, "y": p["y"] / ppm} for p in pts]

    # Analyze each matrix column
    analyses = {}
    for col in MATRIX_COLUMNS:
        pts = scaled.get(col, [])
        if pts:
            analyses[col] = analyze_column(pts)

    # Analyze thumb
    thumb_pts = scaled.get("thumb", [])
    thumb_info = analyze_column(thumb_pts) if thumb_pts else None

    # Build ergogen columns
    # Ergogen splay: rotation applied before laying out the column.
    # In ergogen, the cumulative rotation at each column affects how
    # spread/stagger are interpreted for the NEXT column.
    columns = {}
    prev_center = None
    cumulative_angle = 0.0  # cumulative splay so far

    for i, (ergopad_col, ergogen_name) in enumerate(zip(MATRIX_COLUMNS, ERGOGEN_NAMES)):
        info = analyses.get(ergopad_col)
        if info is None:
            continue

        col_def = {"key": {"column_net": f"C{i}"}}

        if i == 0:
            # First column: splay is its absolute tilt from vertical
            splay = info["angle"]
            if abs(splay) > 0.5:
                col_def["key"]["splay"] = round(splay, 1)
            col_def["key"]["padding"] = round(info["padding"], 1)
            prev_center = info["center"]
            cumulative_angle = splay
        else:
            cx, cy = info["center"]
            px, py = prev_center
            dx = cx - px
            dy = cy - py

            # Ergogen applies spread along the X axis and stagger along Y,
            # in the current rotated coordinate frame. The frame is rotated
            # by the cumulative splay so far.
            #
            # To find what spread/stagger values produce this delta:
            # delta = Rotate(cumulative_angle) * [spread, stagger]
            # So: [spread, stagger] = Rotate(-cumulative_angle) * delta
            rad = math.radians(-cumulative_angle)
            spread = dx * math.cos(rad) - dy * math.sin(rad)
            stagger = dx * math.sin(rad) + dy * math.cos(rad)

            # Splay = this column's angle minus cumulative angle
            splay = info["angle"] - cumulative_angle

            col_def["key"]["spread"] = round(spread, 1)
            col_def["key"]["stagger"] = round(stagger, 1)
            if abs(splay) > 0.5:
                col_def["key"]["splay"] = round(splay, 1)
            col_def["key"]["padding"] = round(info["padding"], 1)

            prev_center = info["center"]
            cumulative_angle += splay

        columns[ergogen_name] = col_def

    # Build thumb zone
    thumb_zone = None
    if thumb_info and "index_far" in analyses:
        inner = analyses["index_far"]
        inner_cx, inner_cy = inner["center"]
        # inner_bottom ≈ center shifted down by one padding along column axis
        inner_rad = math.radians(inner["angle"])
        inner_bottom_x = inner_cx - inner["padding"] * math.sin(inner_rad)
        inner_bottom_y = inner_cy - inner["padding"] * math.cos(inner_rad)

        thumb_cx, thumb_cy = thumb_info["center"]
        shift_x = round(thumb_cx - inner_bottom_x, 1)
        shift_y = round(thumb_cy - inner_bottom_y, 1)

        # Thumb splay relative to the matrix's cumulative rotation
        thumb_splay = thumb_info["angle"]

        n_thumb = thumb_info["n_keys"]
        thumb_cols = {}

        if n_thumb <= 1:
            thumb_cols["t_inner"] = {
                "key": {
                    "column_net": f"C{len(MATRIX_COLUMNS)}",
                    "splay": round(thumb_splay, 1),
                    "spread": key_spacing,
                }
            }
        else:
            # Multiple thumb keys: treat as a fan of single-key columns
            sorted_thumb = sorted(thumb_pts, key=lambda p: p["x"])
            for j in range(min(n_thumb, 3)):
                name = ["t_inner", "t_middle", "t_outer"][j]
                col = {"key": {"column_net": f"C{len(MATRIX_COLUMNS) + j}", "spread": key_spacing}}
                if j == 0 and abs(thumb_splay) > 0.5:
                    col["key"]["splay"] = round(thumb_splay, 1)
                thumb_cols[name] = col

        thumb_zone = {
            "anchor": {
                "ref": "matrix_inner_bottom",
                "shift": [shift_x, shift_y],
            },
            "columns": thumb_cols,
            "rows": {"cluster": {"row_net": "R3"}},
        }

    # Assemble config
    config = {
        "meta": {"engine": "4.1.0"},
        "units": {
            "kx": key_spacing,
            "ky": key_spacing,
            "px": "kx + 1",
            "py": "ky + 1",
        },
        "points": {
            "mirror": {
                "ref": "matrix_inner_home",
                "distance": mirror_distance,
            },
            "zones": {
                "matrix": {
                    "anchor": {"shift": [100, -100]},
                    "columns": columns,
                    "rows": {
                        "bottom": {"row_net": "R2"},
                        "home": {"row_net": "R1"},
                        "top": {"row_net": "R0"},
                    },
                },
            },
        },
    }

    if thumb_zone:
        config["points"]["zones"]["thumb"] = thumb_zone

    # Include outlines/cases/pcbs so the config is self-contained
    # (defaults.yaml references point names specific to ergogen_xyz)
    config["outlines"] = {
        "_keycaps": [{"what": "rectangle", "where": True, "size": ["kx - 0.5", "ky - 0.5"]}],
        "board": [{"what": "rectangle", "where": True, "size": ["px", "py"], "bound": True, "fillet": 2}],
        "switch_cutouts": [{"what": "rectangle", "where": True, "size": [13.8, 13.8], "bound": False}],
    }
    config["cases"] = {
        "bottom_plate": [{"what": "outline", "name": "board", "extrude": 1.2}],
        "switch_plate": [
            {"what": "outline", "name": "board", "extrude": 1.5},
            {"what": "outline", "name": "switch_cutouts", "extrude": 1.5, "operation": "subtract"},
        ],
    }
    config["pcbs"] = {
        "keyboard": {
            "outlines": {"main": {"outline": "board", "layer": "Edge.Cuts"}},
            "footprints": {
                "cherry_ulp": {
                    "what": "cherry_ulp",
                    "where": True,
                    "params": {"from": "{{column_net}}", "to": "{{colrow}}", "keycaps": True},
                },
                "diode": {
                    "what": "diode",
                    "where": True,
                    "params": {"from": "{{colrow}}", "to": "{{row_net}}"},
                    "adjust": {"shift": [0, 5]},
                },
            },
        },
    }

    return config


def config_to_yaml(config):
    """Serialize config to YAML with ergogen-friendly formatting."""

    class ErgogenDumper(yaml.SafeDumper):
        pass

    def str_representer(dumper, data):
        if any(c in data for c in "{}[]:#&*!|>'\""):
            return dumper.represent_scalar("tag:yaml.org,2002:str", data, style='"')
        return dumper.represent_scalar("tag:yaml.org,2002:str", data)

    ErgogenDumper.add_representer(str, str_representer)

    header = (
        "# Ergogen config — generated from ergopad hand scan\n"
        "# Cherry MX ULP switches\n"
        "#\n"
        "# To regenerate: python3 ergopad_to_ergogen.py <input.json> --name <person>\n"
        "#                ./generate.sh <person>\n"
        "\n"
    )

    return header + yaml.dump(
        config,
        Dumper=ErgogenDumper,
        default_flow_style=False,
        sort_keys=False,
        width=120,
        allow_unicode=True,
    )


# ── CLI ─────────────────────────────────────────────────────────────

def main():
    parser = argparse.ArgumentParser(
        description="Convert ergopad JSON to ergogen config.yaml",
        epilog="Example: python3 ergopad_to_ergogen.py scan.json --name barry",
    )
    parser.add_argument("input", help="Path to ergopad JSON file (or - for stdin)")
    parser.add_argument("--name", help="Person name — writes to input/<name>/config.yaml")
    parser.add_argument("--mirror-distance", type=float, default=22,
                        help="Distance between mirrored halves (default: 22)")
    parser.add_argument("--key-spacing", type=float, default=18,
                        help="Key spacing in mm (default: 18 for Cherry MX ULP)")
    parser.add_argument("--no-flip-y", action="store_true",
                        help="Skip Y-axis flip (if coordinates are already Y-up)")

    args = parser.parse_args()

    # Read input
    if args.input == "-":
        data = json.load(sys.stdin)
    else:
        with open(args.input) as f:
            data = json.load(f)

    # Validate
    valid_columns = {"pinky", "ring", "middle", "index", "index_far", "thumb"}
    found = set(data.keys()) & valid_columns
    if not found:
        print(f"Error: no valid columns found. Expected keys: {valid_columns}", file=sys.stderr)
        print(f"Got: {set(data.keys())}", file=sys.stderr)
        sys.exit(1)

    missing = valid_columns - set(data.keys())
    if missing:
        print(f"Note: missing columns (will be skipped): {missing}", file=sys.stderr)

    # If --no-flip-y, pre-flip so the converter's internal flip is a no-op
    if args.no_flip_y:
        for col in data:
            data[col] = [{"x": p["x"], "y": -p["y"]} for p in data[col]]

    # Convert
    config = ergopad_to_ergogen(data, args.mirror_distance, args.key_spacing)
    output = config_to_yaml(config)

    # Write
    if args.name:
        script_dir = Path(__file__).parent
        out_dir = script_dir / "input" / args.name
        out_dir.mkdir(parents=True, exist_ok=True)
        out_path = out_dir / "config.yaml"
        out_path.write_text(output)
        print(f"Wrote {out_path}", file=sys.stderr)
        print(f"Next: ./generate.sh {args.name}", file=sys.stderr)
    else:
        print(output)


if __name__ == "__main__":
    main()
