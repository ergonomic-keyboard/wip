#!/usr/bin/env python3
"""
Convert ergopad JSON export (map.json) to ergogen config.yaml.

Uses actual finger positions and angles from the hand scan to produce
a layout with correct per-column rotation (splay) and key placement.

Usage: python3 convert.py input/<name>/map.json > input/<name>/config.yaml
"""

import json
import sys
import math


def load_map(path):
    with open(path) as f:
        return json.load(f)


def linear_regression_angle(pts):
    """Return angle in degrees of the best-fit line through points."""
    n = len(pts)
    if n < 2:
        return -90.0
    xs = [p[0] for p in pts]
    ys = [p[1] for p in pts]
    mx, my = sum(xs) / n, sum(ys) / n
    num = sum((x - mx) * (y - my) for x, y in zip(xs, ys))
    den = sum((x - mx) ** 2 for x in xs)
    if abs(den) < 1e-6:
        return -90.0 if ys[0] > ys[-1] else 90.0
    slope = num / den
    return math.degrees(math.atan(slope))


def cluster_into_rows(pts, n_rows=3):
    """
    Cluster points into n_rows groups along y-axis.
    Returns centroids sorted top to bottom (ascending y in screen coords).
    """
    if len(pts) <= n_rows:
        return sorted(pts, key=lambda p: p[1])

    sorted_pts = sorted(pts, key=lambda p: p[1])
    y_min = sorted_pts[0][1]
    y_max = sorted_pts[-1][1]
    y_range = y_max - y_min
    if y_range < 1:
        return [sorted_pts[len(sorted_pts) // 2]]

    # K-means on y
    centroids_y = [y_min + y_range * (i + 0.5) / n_rows for i in range(n_rows)]
    clusters = [[] for _ in range(n_rows)]

    for _ in range(20):
        clusters = [[] for _ in range(n_rows)]
        for p in sorted_pts:
            dists = [abs(p[1] - c) for c in centroids_y]
            clusters[dists.index(min(dists))].append(p)
        new_centroids = []
        for c in clusters:
            if c:
                new_centroids.append(sum(p[1] for p in c) / len(c))
            else:
                new_centroids.append(centroids_y[len(new_centroids)])
        centroids_y = new_centroids

    result = []
    for c in clusters:
        if c:
            cx = sum(p[0] for p in c) / len(c)
            cy = sum(p[1] for p in c) / len(c)
            result.append((cx, cy))
    return sorted(result, key=lambda p: p[1])


def generate_config(data, key_spacing_mm=18.0):
    """Generate ergogen YAML config from ergopad data."""

    finger_order = ['pinky', 'ring', 'middle', 'index', 'index_far']
    available = [f for f in finger_order if f in data and f != 'thumb']

    # Process each finger
    col_data = {}
    for finger in available:
        pts = [(p['x'], p['y']) for p in data[finger]]
        angle = linear_regression_angle(pts)
        rows = cluster_into_rows(pts, 3)
        col_data[finger] = {'angle': angle, 'rows': rows}

    # Pixel scale: average inter-column home-row distance -> key_spacing_mm
    home_positions = []
    for f in available:
        rows = col_data[f]['rows']
        home_positions.append(rows[len(rows) // 2])

    inter_col_dists = []
    for i in range(1, len(home_positions)):
        dx = home_positions[i][0] - home_positions[i - 1][0]
        dy = home_positions[i][1] - home_positions[i - 1][1]
        inter_col_dists.append(math.sqrt(dx * dx + dy * dy))

    avg_col_px = sum(inter_col_dists) / len(inter_col_dists) if inter_col_dists else 100
    scale = key_spacing_mm / avg_col_px

    # Per-column: spread, stagger, splay, row padding
    # splay = difference in finger angle from previous column
    # In ergogen, splay rotates the column. Finger angle near -90 = vertical.
    # Column rotation in ergogen coords: finger angle of -90 = 0 splay (vertical column).
    # Deviation from vertical = angle + 90 for negative angles,
    # or -(angle - 90) for positive angles.
    def finger_splay(angle):
        """Convert screen-coords finger angle to ergogen column rotation."""
        if angle < 0:
            return -(angle + 90)  # e.g. -80 -> 10 (tilted 10 deg)
        else:
            return -(angle - 90)  # e.g. +84 -> 6 (tilted 6 deg)

    splays = [finger_splay(col_data[f]['angle']) for f in available]

    # Ergogen splay is cumulative, so each column's splay is the delta from previous
    delta_splays = [splays[0]]
    for i in range(1, len(splays)):
        delta_splays.append(splays[i] - splays[i - 1])

    # Spread: distance between adjacent home row positions, min key_spacing_mm
    spreads = []
    for i in range(1, len(home_positions)):
        dx = home_positions[i][0] - home_positions[i - 1][0]
        dy = home_positions[i][1] - home_positions[i - 1][1]
        raw = math.sqrt(dx * dx + dy * dy) * scale
        spreads.append(round(max(raw, key_spacing_mm), 1))

    # Stagger: vertical offset between adjacent columns (in ergogen: y-shift when moving to next col)
    # In screen coords, y increases down. In ergogen, y increases up.
    staggers = []
    for i in range(1, len(home_positions)):
        dy = -(home_positions[i][1] - home_positions[i - 1][1]) * scale
        staggers.append(round(dy, 1))

    # Row padding per column — enforce minimum of key_spacing_mm to prevent overlap
    paddings = []
    for f in available:
        rows = col_data[f]['rows']
        dists = []
        for i in range(1, len(rows)):
            dx = rows[i][0] - rows[i - 1][0]
            dy = rows[i][1] - rows[i - 1][1]
            dists.append(math.sqrt(dx * dx + dy * dy))
        raw = (sum(dists) / len(dists) * scale) if dists else key_spacing_mm
        paddings.append(round(max(raw, key_spacing_mm), 1))

    # Thumb cluster
    thumb_spread = key_spacing_mm
    thumb_splay = 0.0
    thumb_shift_x = 0.0
    thumb_shift_y = -20.0
    if 'thumb' in data:
        thumb_pts = [(p['x'], p['y']) for p in data['thumb']]
        thumb_angle = linear_regression_angle(thumb_pts)
        thumb_rows = cluster_into_rows(thumb_pts, 3)
        thumb_splay = round(thumb_angle, 1)

        # Position relative to innermost column bottom row
        inner_bottom = col_data[available[-1]]['rows'][-1]
        thumb_center = thumb_rows[len(thumb_rows) // 2]
        thumb_shift_x = round((thumb_center[0] - inner_bottom[0]) * scale, 1)
        thumb_shift_y = round(-(thumb_center[1] - inner_bottom[1]) * scale, 1)

        # Spread between thumb keys
        t_dists = []
        for i in range(1, len(thumb_rows)):
            dx = thumb_rows[i][0] - thumb_rows[i - 1][0]
            dy = thumb_rows[i][1] - thumb_rows[i - 1][1]
            t_dists.append(math.sqrt(dx * dx + dy * dy))
        raw = (sum(t_dists) / len(t_dists) * scale) if t_dists else key_spacing_mm
        thumb_spread = round(max(raw, key_spacing_mm), 1)

    # Build YAML
    col_names = ['pinky', 'ring', 'middle', 'index', 'inner']
    lines = []
    lines.append("# Ergogen config - generated from ergopad hand scan")
    lines.append("# Cherry MX ULP switches")
    lines.append("")
    lines.append("units:")
    lines.append("  kx: 18")
    lines.append("  ky: 18")
    lines.append("  px: kx + 1")
    lines.append("  py: ky + 1")
    lines.append("")
    lines.append("points:")
    lines.append("  mirror:")
    lines.append("    ref: matrix_inner_home")
    lines.append("    distance: 22")
    lines.append("  zones:")
    lines.append("    matrix:")
    lines.append("      anchor:")
    lines.append("        shift: [100, -100]")
    lines.append("      columns:")

    for i, f in enumerate(available):
        name = col_names[i]
        lines.append(f"        {name}:")
        lines.append(f"          key:")
        lines.append(f"            column_net: C{i}")
        if i == 0:
            lines.append(f"            splay: {round(delta_splays[0], 1)}")
        else:
            lines.append(f"            spread: {spreads[i-1]}")
            lines.append(f"            stagger: {staggers[i-1]}")
            lines.append(f"            splay: {round(delta_splays[i], 1)}")
        lines.append(f"            padding: {paddings[i]}")

    lines.append("      rows:")
    lines.append("        bottom:")
    lines.append("          row_net: R2")
    lines.append("        home:")
    lines.append("          row_net: R1")
    lines.append("        top:")
    lines.append("          row_net: R0")

    # Thumb
    net_idx = len(available)
    lines.append("    thumb:")
    lines.append("      anchor:")
    lines.append("        ref: matrix_inner_bottom")
    lines.append(f"        shift: [{thumb_shift_x}, {thumb_shift_y}]")
    lines.append("      columns:")
    lines.append("        t_inner:")
    lines.append("          key:")
    lines.append(f"            column_net: C{net_idx}")
    lines.append(f"            splay: {thumb_splay}")
    lines.append(f"            spread: {thumb_spread}")
    lines.append("        t_middle:")
    lines.append("          key:")
    lines.append(f"            column_net: C{net_idx+1}")
    lines.append(f"            splay: 0")
    lines.append(f"            spread: {thumb_spread}")
    lines.append("        t_outer:")
    lines.append("          key:")
    lines.append(f"            column_net: C{net_idx+2}")
    lines.append(f"            splay: 0")
    lines.append(f"            spread: {thumb_spread}")
    lines.append("      rows:")
    lines.append("        cluster:")
    lines.append("          row_net: R3")

    # Outlines
    lines.append("")
    lines.append("outlines:")
    lines.append("  _keycaps:")
    lines.append("    - what: rectangle")
    lines.append("      where: true")
    lines.append("      size: [kx - 0.5, ky - 0.5]")
    lines.append("  board:")
    lines.append("    - what: rectangle")
    lines.append("      where: true")
    lines.append("      size: [px, py]")
    lines.append("      bound: true")
    lines.append("      fillet: 2")
    lines.append("  switch_cutouts:")
    lines.append("    - what: rectangle")
    lines.append("      where: true")
    lines.append("      size: [13.8, 13.8]")
    lines.append("      bound: false")

    # Cases
    lines.append("")
    lines.append("cases:")
    lines.append("  bottom_plate:")
    lines.append("    - what: outline")
    lines.append("      name: board")
    lines.append("      extrude: 1.2")
    lines.append("  switch_plate:")
    lines.append("    - what: outline")
    lines.append("      name: board")
    lines.append("      extrude: 1.5")
    lines.append("    - what: outline")
    lines.append("      name: switch_cutouts")
    lines.append("      extrude: 1.5")
    lines.append("      operation: subtract")

    # PCBs
    lines.append("")
    lines.append("pcbs:")
    lines.append("  keyboard:")
    lines.append("    outlines:")
    lines.append("      main:")
    lines.append("        outline: board")
    lines.append("        layer: Edge.Cuts")
    lines.append("    footprints:")
    lines.append("      choc_hotswap:")
    lines.append("        what: choc")
    lines.append("        where: true")
    lines.append("        params:")
    lines.append('          from: "{{column_net}}"')
    lines.append('          to: "{{colrow}}"')
    lines.append("          keycaps: true")
    lines.append("          reverse: false")
    lines.append("          hotswap: true")
    lines.append("      diode:")
    lines.append("        what: diode")
    lines.append("        where: true")
    lines.append("        params:")
    lines.append('          from: "{{colrow}}"')
    lines.append('          to: "{{row_net}}"')
    lines.append("        adjust:")
    lines.append("          shift: [0, 5]")

    return "\n".join(lines) + "\n"


if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python3 convert.py <map.json>", file=sys.stderr)
        sys.exit(1)

    data = load_map(sys.argv[1])
    config = generate_config(data)
    print(config)
