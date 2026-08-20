# Versioning Policy

`package.json` is the canonical extension version. `package-lock.json`, package
metadata, README references, and release documentation are mirrors when they
express the extension version.

Before changing a version, scan `package.json`, `package-lock.json`,
`CHANGELOG.md`, `README.md`, and all occurrences of the current and target
version. Keep required mirrors aligned and run relevant local validation.

Use patch for compatible fixes and maintenance, minor for compatible public
features, and major for breaking extension, formatter, grammar, or
configuration behavior. Governance, skills, Serena, and ProjectAtlas changes
normally have no version impact.
