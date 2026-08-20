---
name: serena-index-freshness
description: Keep Serena semantic indexes current only when supported-language evidence requires it.
---

Inspect `serena --version`, `.serena/project.yml`, configured languages, ignore
rules, and cache state before choosing an index action. Use a full
`serena project index` only after initial setup, a cache-incompatible upgrade,
language/ignore changes, missing or corrupt caches, or a demonstrated freshness
failure. Do not semantically send `.vbi` or `.vi` to Serena until this project
provides a native InTouch language server. Memories are advisory and never
override source or governance.
