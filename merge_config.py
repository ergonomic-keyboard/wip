#!/usr/bin/env python3
"""Merge a points-only ergogen config with the defaults file."""
import sys
import yaml

config_path = sys.argv[1]
defaults_path = sys.argv[2]

with open(config_path) as f:
    config = yaml.safe_load(f)

with open(defaults_path) as f:
    defaults = yaml.safe_load(f)

# Only add sections that are missing from config
for key in ('outlines', 'cases', 'pcbs'):
    if key not in config:
        config[key] = defaults[key]

yaml.dump(config, sys.stdout, default_flow_style=False, sort_keys=False)
