---
name: projectatlas-index-freshness
description: Refresh ProjectAtlas only when repository-index evidence makes it necessary.
---

Confirm the root, runtime version, config, database identity, and watcher state
before refreshing. Use `projectatlas watch --once` for ordinary saved changes,
moves, or deletions. Use a full scan only for initial setup, scan-affecting
ignore/configuration changes, a missing index, a package split, mass rename, or
verified corruption. Never edit SQLite directly or reindex just because a
session starts. Report the resulting generation and known coverage limits.
