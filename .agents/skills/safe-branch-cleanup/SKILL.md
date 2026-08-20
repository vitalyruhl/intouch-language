---
name: safe-branch-cleanup
description: Remove only proven-integrated branches during explicitly authorized workflow cleanup.
---

Verify exact local and remote targets and prove integration against the intended
base. Preserve the active branch, `main`, `master`, release branches, unmerged
branches, and ambiguous branches. Use the least destructive authorized action;
never force-delete a branch.
