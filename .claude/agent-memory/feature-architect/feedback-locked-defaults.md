---
name: feedback-locked-defaults
description: When the user supplies recommended defaults and says implement, lock them — do not re-litigate
metadata:
  type: feedback
---

If the user (or parent agent) lists open-question recommended defaults and says to treat them as locked / implement rather than debate, write the design against those defaults with no alternatives section arguing them.

**Why:** Re-debating locked OQs wastes a design cycle the user already closed.
**How to apply:** Record the defaults in the design’s header and map them to FRs. Mention them in Alternatives only if a *technical* constraint conflicts (e.g. SCAN_GENERATION forcing serial scans under OQ-6).
