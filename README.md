# Custom Keyboard Generator

A browser-based tool for designing custom split ergonomic keyboards. Tap your finger positions, preview in 3D, and get a complete bill of materials with purchase links.

## Quick Start

Launch both the keyboard wizard and the requirement tracker:

```bash
cd /home/a/git/git/keyboard/wip
fuser -k 8080/tcp 8099/tcp 2>/dev/null; python3 -m http.server 8080 & node req-tracker.js & wait
```

- Keyboard wizard: http://localhost:8080/wizard.html
- Requirement tracker: http://localhost:8099

## Keyboard Wizard

Open http://localhost:8080/wizard.html and follow the 4 steps:

1. **Tap finger positions** — place your left hand flat and tap 3 key positions per finger column (pinky through thumb)
2. **3D preview** — interactive 3D model with shadows, wooden frame enclosure, click-to-press keys, exploded view, and component labels
3. **Bill of materials** — full parts list with prices and purchase links, download design files as a ZIP
4. **Firmware & test** — generated ZMK shield files, keymap visualization, native_posix hardware emulation tests

## Requirement Tracker

Tracks PASS/FAIL/SKIP status for each requirement in `final_requirements.md`, per git commit.

```bash
node req-tracker.js
```

Open http://localhost:8099.

**Features:**
- Each requirement from `final_requirements.md` is shown with its full text
- Mark each requirement PASS, FAIL, or SKIP
- Click the comment button to add notes (e.g. what's wrong, how to fix it)
- Edit requirement text inline (click the text, edit, click away to save)
- Add new requirements with the "+ Add requirement" button
- Navigate between git commits using the arrows in the top-right
- When navigating to a commit with no status, it inherits PASS/FAIL/SKIP from the nearest reviewed commit (comments are per-commit and not inherited)

**Storage:**
- Status files are saved in `req-status/<commit-hash>.json`
- These files are inside the git repo — commit them to sync progress to GitHub
- Requirement edits are saved directly to `final_requirements.md`
