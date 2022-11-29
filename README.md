# Intouch-Language README

<!-- markdownlint-disable MD033 -->
<!-- markdownlint-disable MD001 -->
<!-- markdownlint-disable MD013 -->
<!-- markdownlint-disable MD025 -->
<!-- markdownlint-disable MD026 -->

<p align="center">
  <br />
  <a title="Intouch-Language" href="https://github.com/vitalyruhl/intouch-language"><img src="https://raw.githubusercontent.com/vitalyruhl/intouch-language/master/images/logo.png" alt="Intouch-Language Logo" width="10%" /></a>
</p>

[![Version](https://vsmarketplacebadge.apphb.com/version/Vitaly-ruhl.intouch-language.svg)](https://marketplace.visualstudio.com/items?itemName=Vitaly-ruhl.intouch-language)
[![Installs](https://vsmarketplacebadge.apphb.com/installs-short/Vitaly-ruhl.intouch-language.svg)](https://marketplace.visualstudio.com/items?itemName=Vitaly-ruhl.intouch-language)
[![Rating](https://vsmarketplacebadge.apphb.com/rating/Vitaly-ruhl.intouch-language.svg)](https://marketplace.visualstudio.com/items?itemName=Vitaly-ruhl.intouch-language)

<br>
<br>

# Intouch-Language

- **Intouch-Language** is an open source extension created for **Visual Studio Code** (**Not official!**). It provides `syntax highlighting`, `snippets` and `auto-format` function for Intouch Basic. New since 2022.11.28 - own darkmode theme for VSC, names Intouch Dark.
- **Intouch** is a programming language for AVEVA (Wonderware) SCADA Intouch Applications.

<p align="center" bgcolor:=#3f3f3f>
  <br />
  <a title="Intouch" href="https://factorysoftware.de/"><img src="https://factorysoftware.de/resources/uploads/2020/02/wonderware-germany-austria-footer.png" alt="Intouch" /></a>   
</p>

<br>
<br>

# Example

<table align="center" width="100%" border="0">
  <tr>
    <td align="center" border="0">
    <a title="Intouch-Language" href="https://github.com/vitalyruhl/intouch-language"><img src="https://raw.githubusercontent.com/vitalyruhl/intouch-language/master/images/example.gif" alt="Example" width="60%" /></a>
    </td>
  </tr>
</table>

<br>
<br>

# New Theme

NOTE: The default VS Code theme does not color much. Switch to intouch theme (installed by this extension) or use a theme like one of the following to benefit from the changes:

- [Material Theme](https://marketplace.visualstudio.com/items?itemName=Equinusocio.vsc-material-theme)
- [XD Theme](https://marketplace.visualstudio.com/items?itemName=jeff-hykin.xd-theme)
- [Noctis](https://marketplace.visualstudio.com/items?itemName=liviuschera.noctis)
- [Kary Pro Colors](https://marketplace.visualstudio.com/items?itemName=karyfoundation.theme-karyfoundation-themes)
- [One Monokai Theme](https://marketplace.visualstudio.com/items?itemName=azemoh.one-monokai)
- [Winteriscoming](https://marketplace.visualstudio.com/items?itemName=johnpapa.winteriscoming)
- [Popping and Locking](https://marketplace.visualstudio.com/items?itemName=hedinne.popping-and-locking-vscode)
- [Syntax Highlight Theme](https://marketplace.visualstudio.com/items?itemName=peaceshi.syntax-highlight)
- [Default Theme Enhanced](https://marketplace.visualstudio.com/items?itemName=ms-vscode.cpptools-themes)

<br>
<br>

## Example diffrent themes

<table align="center" width="100%" border="0">
  <tr>
    <td align="center" border="0">
    <p>Intouch Theme Dark</p>
    <a title="Intouch Theme Dark" href="https://github.com/vitalyruhl/intouch-language"><img src="https://raw.githubusercontent.com/vitalyruhl/intouch-language/master/images/intouchTheme.jpg" alt="Intouch Theme Dark" width="60%" /></a>
    </td>
    <td align="center" border="0">
    <p>VSC Theme Dark+</p>
    <a title="VSC Theme Dark+" href="https://github.com/vitalyruhl/intouch-language"><img src="https://raw.githubusercontent.com/vitalyruhl/intouch-language/master/images/VSC_Dark_Plus.jpg" alt="VSC Theme Dark+" width="60%" /></a>
    </td>
    </tr>
    <tr>
    <td align="center" border="0">
    <p>Material Theme Darker</p>
    <a title="Material Theme Darker" href="https://github.com/vitalyruhl/intouch-language"><img src="https://raw.githubusercontent.com/vitalyruhl/intouch-language/master/images/Material_Theme_Darker.jpg" alt="Material Theme Darker" width="60%" /></a>
    </td>
    <td align="center" border="0">
    <p>VSC Theme Light</p>
    <a title="VSC Theme Light" href="https://github.com/vitalyruhl/intouch-language"><img src="https://raw.githubusercontent.com/vitalyruhl/intouch-language/master/images/VSC_Light.jpg" alt="VSC Theme Light" width="60%" /></a>
    </td>
  </tr>
</table>

<br>
<br>

# Test and example

> You can test it on this **%USERPROFILE%\\.vscode\extensions\intouch-language\other\test\test.vbi** by press **`shift + alt + F`**

<br>
<br>

# Installation

- Standatd Installation:
  - Install it in ext.-manager (type Intouch) or from
    [Visual Studio Marketplace](https://marketplace.visualstudio.com/items?itemName=Vitaly-ruhl.intouch-language)
- Install from Github:
  - Copy or clone all in to: `%USERPROFILE%\.vscode\extensions\intouch-language\`
    - `cd ~/.vscode/extensions/`
    - `git clone https://github.com/vitalyruhl/intouch-language.git`
  - Open shell there and type `npm i`
  - Run: `npm run compile`, or `npm run watch` if you want to make changes in src folder.
  - You must restart the VS-Code after installation, to apply new settings

<p align="center">
  <br />
  <br />
</p>

# Snippets

- Dimb -> Dim Boolean (Discrete)
- Dimi -> Dim Integer
- Dims -> Dim String (Message)
- If# -> If code block
- Ife -> If Else code block
- for# -> add for-next-block
- log# -> Log-Debug
- cb# -> add new Code-Block
- func# -> add new empty Function

<p align="center">
  <br />
  <br />
</p>

# Others

> Save your code as `.vbi` or `.vi` for automatic language recognition.

---

> Better-Comment Plugin

- [Use this Branch (beta) from github - it works on all Languages](https://github.com/aaron-bond/better-comments/tree/all-languages)

<p align="center">
  <br />
  <hr />
  <br />
</p>

### Enjoy!

> [Please report missing rules or future-requests on this link.](https://github.com/vitalyruhl/intouch-language/issues)

<br>
<br>

# Todo

- **Formatter**
  - Issues
    - Bug 13.02.2022 `For-next` not in plan when there are an `EXIT FOR` statement
    - Bug 13.02.2022 Nesting bug -> code in multiline comment will formatted to?!
  - Futures planned
    - Format on selection (now is formatting document!)

<br>

- **Syntax-highlighting**
  - No issues
  - Futures planned
    - Add code checker for some errors in code

<br>

- **Snippets**
  - No issues
  - No futures planned

<br>
<br>

---

# What's new in Intouch-Language

### V1.4.0

- Correct some bugs in regex for syntax-highlighting
- Theme -> Add more compatibility to other languages
- Add more compatibility to other Themes (e.g. material-theme)

### V1.3.0

- Add own dark theme based on [GitHub (Dark Classic) VS Code theme](https://github.com/BerriJ/github-vscode-theme-dark-classic) from BerriJ
- Some bugfixes in regex for Keywords

### V1.2.4

- Update dependencies

### V1.2.3

- Bome bugfixes

### V1.2.2

- Bugfix on snippets

### V1.2.1

- Bugfix trailing whitespace before `-`

### V1.2.0

- Add folding between `{region xxxx}` and `{endregion xxxx}`
- Add Nesting between `{region xxxx}` and `{endregion xxxx}`
- Auto closing brackets in strings and comments.
- Remove unused dependency with dependabot alert.
- Add wordPattern and indentationRules into language configuration.
- <fix bug - issue #13, formatter formats dashed variable `foo-bar` --> `foo - bar`

### V1.1.1

- Version issue with format problem on <>, =<, =>, == was published with greater version

### V1.1.0

- Add Code-Blocks for Nesting and Folding in code without keywords Start:`{>`, End:`{<`
- Add **Snipped** cb# : add new Code-Block
- Add **Snipped** for# : add for-next-block
- Add **Snipped** func# : add new empty Function
- Correct some spelling mistakes
- Remove debugging settings

### V1.0.0

- Add **Formatting Function**

<br>
<br>

---

## Donate

<table align="center" width="100%" border="0" bgcolor:=#3f3f3f>
<tr align="center">
<td align="center">  
if you prefer a one-time donation

[![donate-Paypal](https://www.paypalobjects.com/en_US/i/btn/btn_donateCC_LG.gif)](https://paypal.me/FamilieRuhl)

</td>

<td align="center">  
Become a patron, by simply clicking on this button (**very appreciated!**):

[![Become a patron](https://c5.patreon.com/external/logo/become_a_patron_button.png)](https://www.patreon.com/join/6555448/checkout?ru=undefined)

</td>
</tr>
</table>

<br>
<br>

---

## Copyright

`2021-2022 (c)Vitaly Ruhl`

License: GNU General Public License v3.0
