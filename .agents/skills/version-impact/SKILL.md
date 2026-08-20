---
name: version-impact
description: Classify extension version impact before public behavior, dependencies, or package metadata change.
---

Use `package.json` as the canonical version source. Inspect its documented
mirrors and classify the change as no impact, patch, minor, or major according
to `.github/policies/versioning.md`. Governance, skills, Serena, and
ProjectAtlas changes normally have no version impact; do not invent a bump.
