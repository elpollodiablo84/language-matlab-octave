# atom.io language-matlab-plus package
Atom.io language support for Matlab, with persistent variables highlighting like in the default Matlab Editor.

Originally converted from the TextMate Bundle https://github.com/textmate/matlab.tmbundle.

Forked from https://github.com/thedavidprice/language-matlab-octave.

### Features
- A lot of corrections and optimizations from the original conversion.
- Code sections borders.
- Persistent variables highlighting like in the default MATLAB editor. You can change the color in your [stylesheet](https://flight-manual.atom.io/using-atom/sections/basic-customization/#style-tweaks) adding
~~~css
.variable-persistent {
  color: #82AAFF; /*Modify this value to change the color*/
}
~~~

### Planned Features
- Code sections folding (*It should be doable*).
- [tree-sitter](https://github.com/tree-sitter/tree-sitter) grammar.
