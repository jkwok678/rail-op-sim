---
name: disk-sunburst-locked-oqs
description: Locked open-question defaults for Storage Saver Disk Map (sunburst) — do not re-debate
metadata:
  type: project
---

Disk Map (`docs/requirements/disk-sunburst.md`, design `docs/designs/disk-sunburst.md`) OQs are locked as of 2026-10-22:

- OQ-1 tab label: "Disk Map" (view key `diskmap`)
- OQ-2 depth: 4 rings (0–3)
- OQ-3 colour: unique hue per top-level folder, tinted children
- OQ-4 right-click → Reveal in Finder
- OQ-5 files-only folder: single unlabelled aggregate arc
- OQ-6 scan: lazy, one ring at a time via existing `scan_directory`
- OQ-7 centre label always visible (root name + total size)

**Why:** User asked to implement these defaults, not debate them.
**How to apply:** Treat them as requirements. Do not reopen OQs in design or implementation unless the user explicitly changes one.
