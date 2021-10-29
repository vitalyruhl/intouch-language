# Intouch-Language README


<p align="center">
  <br />
  <a title="Intouch-Language" href="https://github.com/vitalyruhl/intouch-language"><img src="https://raw.githubusercontent.com/vitalyruhl/intouch-language/master/images/logo.png" alt="Intouch-Language Logo" width="10%" /></a>
</p>


[![Version](https://vsmarketplacebadge.apphb.com/version/Vitaly-ruhl.intouch-language.svg)](https://marketplace.visualstudio.com/items?itemName=Vitaly-ruhl.intouch-language)
[![Installs](https://vsmarketplacebadge.apphb.com/installs-short/Vitaly-ruhl.intouch-language.svg)](https://marketplace.visualstudio.com/items?itemName=Vitaly-ruhl.intouch-language)
[![Rating](https://vsmarketplacebadge.apphb.com/rating/Vitaly-ruhl.intouch-language.svg)](https://marketplace.visualstudio.com/items?itemName=Vitaly-ruhl.intouch-language) 

<!-- 
[![Build Status](https://travis-ci.org/Vitaly-ruhl/intouch-language.svg?branch=master)](https://travis-ci.org/Vitaly-ruhl/intouch-language)

-->

# What's new in Intouch-Language
- V0.3.2 
  + automatic increased number on publish (my mistake)
- V0.3.1 
  + fixed bug on escaped string end `tmp="\\share\";`
  + Add some missing formatting rules
- V0.3.0 
  + Add **Formatting Function**
  + New Keybinding (`strg+shift+alt+i`) for quickformat in all documents
  + Add **Format on .vbi** with standard `shift+alt+F`
  + Add some settings for formatting feature
- V0.2.2  
  + Add Keywords and all Functions from Intouch 11.1.13 Help
- V0.2.0  
  + Add some **Snippets**

# Intouch-Language
- **Intouch-Language** is an open source extension created for **Visual Studio Code** (**Not official!**). It provides `syntax highlighting`, `snippets` and `auto-format` function for Intouch Basic.
- **Intouch** is a programming language for Wonderware SCADA Intouch Applications.



<p align="center" bgcolor:=#3f3f3f>
  <br />
  <a title="Intouch" href="https://factorysoftware.de/"><img src="https://factorysoftware.de/resources/uploads/2020/02/wonderware-germany-austria-footer.png" alt="Intouch" /></a>   
</p>

# Example
<table align="center" width="100%" border="0">
  <tr>
    <td align="center" border="0">
    <a title="Intouch-Language" href="https://github.com/vitalyruhl/intouch-language"><img src="https://raw.githubusercontent.com/vitalyruhl/intouch-language/master/images/example.gif" alt="Example" width="60%" /></a>
    </td>
  </tr>
</table>


# Install:
* install it from, find in ext.-manager (type Intouch) 
[Visual Studio Marketplace](https://marketplace.visualstudio.com/items?itemName=Vitaly-ruhl.intouch-language)
* (Beta Version) copy or clone all in to: `%USERPROFILE%\.vscode\extensions\intouch-language\`
  + `cd ~/.vscode/extensions/`
  + `git clone https://github.com/vitalyruhl/intouch-language.git`
  + open shell and type `npm i`
  + run: `npm run compile`, or `npm run watch` if you want to make changes in src folder.
  + you must restart the VS-Code after installation, to apply new settings 


> Save your code as `.vbi` or `.vi` for automatic language recognition. 


<p align="center">
  <br />
  <br />
</p>


---


## Donate

<table align="center" width="100%" border="0" bgcolor:=#3f3f3f>
<tr align="center">
<td align="center">  
if you prefer a one-time donation

[![](https://www.paypalobjects.com/en_US/i/btn/btn_donateCC_LG.gif)](https://paypal.me/FamilieRuhl)
</td>

<td align="center">  
Become a patron, by simply clicking on this button (**very appreciated!**):

[![](https://c5.patreon.com/external/logo/become_a_patron_button.png)](https://www.patreon.com/join/6555448/checkout?ru=undefined)

</td>
</tr>
</table>


---

<p align="center">
  <br />
  <br />
</p>


# Snippets:
* Dimb: Dim Boolean (Discrete)
* Dimi: Dim Integer
* Dims: Dim String (Message)
* If# : If code block
* Ife : If Else code block
* log#: Log-Debug



<p align="center">
  <br />
  <br />
</p>

 - - - 

 **ToDo:**

+ **Formatter**
  + Test more code, and add some missing formatting rules
  + Please report missing rules or future-requests [there](https://github.com/vitalyruhl/intouch-language/issues)
  
<br>

+ **Syntax-highlighting**
  + no issues
  + no futures planned
  
<br>

+ **Snippets**
  + no issues
  + no futures planned

 
> [Please report **all** issues or future-requests on this link.](https://github.com/vitalyruhl/intouch-language/issues)

 - - - 


<!-- 
* **Bug**:  Keywords bug:<br /> <a title="Intouch-Language bug3" href="https://github.com/vitalyruhl/intouch-language"><img src="https://raw.githubusercontent.com/vitalyruhl/intouch-language/master/images/bugs/Screenshot_3.jpg" alt="Intouch-Language bug3" width="80%" /></a>
<br /> <br /><a title="Intouch-Language bug3" href="https://github.com/vitalyruhl/intouch-language"><img src="https://raw.githubusercontent.com/vitalyruhl/intouch-language/master/images/bugs/Screenshot_4.jpg" alt="Intouch-Language bug3" width="80%" /></a>
-->


**Enjoy!**

<br>

<br>

- - -

## Copyright
`2021 (c)Vitaly Ruhl`

License: GNU General Public License v3.0