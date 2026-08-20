# Changelog

<!-- markdownlint-disable MD033 -->
<!-- markdownlint-disable MD001 -->
<!-- markdownlint-disable MD013 -->
<!-- markdownlint-disable MD025 -->

### V1.4.0

- 29.11.2022 VitalyRuhl
- Correct some bugs in regex for syntax-highlighting
- Theme -> Add more compatibility to other languages
- Add more compatibility to other Themes (e.g. material-theme)

### V1.3.0

- 28.11.2022 VitalyRuhl
- Add own dark theme based on [GitHub (Dark Classic) VS Code theme](https://github.com/BerriJ/github-vscode-theme-dark-classic) from BerriJ
- Some bugfixes in regex for Keywords

### V1.2.4

- 12.11.2022 VitalyRuhl
- Update dependencies

### V1.2.3

- Bump bugfixes

### V1.2.2

- Bugfix on snippets

### V1.2.1

- 25.01.2022 VitalyRuhl
- Bugfix trailing whitespace before `-`

### V1.2.0

- 23.01.2022 VitalyRuhl
- Add folding between `{region xxxx}` and `{endregion xxxx}`
- Add Nesting between `{region xxxx}` and `{endregion xxxx}`
- Auto closing brackets in strings and comments.
- Remove unused dependency with dependabot alert.
- Add wordPattern and indentationRules into language configuration.
- <fix bug - issue #13, formatter formats dashed variable `foo-bar` --> `foo - bar`

### V1.1.1

- Version issue with format problem on <>, =<, =>, == was published with greater version

### V1.1.0

- 02.11.2021 VitalyRuhl
- Add Code-Blocks for Nesting and Folding in code without keywords
- Add **Snippet** cb# : add new Code-Block
- Add **Snippet** func# : add new empty Function
- Correct some spelling mistakes
- Remove debugging settings

### V1.0.0

- correct `.vscodeignore`, and Release it as ready

### V0.3.3

- 2021.10.29 VitalyRuhl
- correct some spelling mistakes
- debug per default `off`, instead `on`
- correct `.vscodeignore`

### V0.3.2

- 2021.10.29 VitalyRuhl
- automatic increased number on publish (my mistake)

### V0.3.1

- 2021.10.28 VitalyRuhl
- fixed bug on escaped string end `tmp="\\share\";`
- Add some missing formatting rules

### V0.3.0

- 2021.10.28 VitalyRuhl
- Add **Formatting Function**
- New Keybinding (`strg+shift+alt+i`) for quickformat in all documents
- Add **Format on .vbi** with standard `shift+alt+F`
- Add some settings for formatting feature

### 0.2.0

- 2020.07.22 VitalyRuhl
- Add and test all Intouch Keywords

### 0.1.2

- 2020.07.03 VitalyRuhl
- Correct links to Marketplace

### 0.1.1

- 2020.07.02 VitalyRuhl
- Publish Beta Release on VSC-Marketplace

### 0.1.0

- Fixing some bugs, Beta Release

### 0.0.5

- **Bug**: {**region** and **#region** - folding does not work} <br /><br />
- **Bug**: in comments with Strings: --> 21.06.2020 **fixed** (V0.0.5)
- **Bug**: String termination: --> 21.06.2020 **fixed** (V0.0.5)
- **Bug**: Keywords bug: --> 21.06.2020 **fixed** (V0.0.5)

### 0.0.4

- **Bug**: Not all strings are recognized --> 21.06.2020 **fixed** (V0.0.4)

### 0.0.3

- **Bug**: Comments are not recognized --> 05.06.2020 **fixed** (V0.0.3)

### 0.0.1 / 0.0.2

- Initial Release
