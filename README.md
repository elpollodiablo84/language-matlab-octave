# atom.io language-matlab-plus package
Atom.io language support for Matlab, with some features similar to the default Matlab Editor.

Forked from https://github.com/thedavidprice/language-matlab-octave.

Originally converted from the TextMate Bundle https://github.com/textmate/matlab.tmbundle.

### Features
- A lot of corrections and optimizations from the original conversion.
- Code sections borders.
- Code sections folding.
- Persistent variables highlighting like in the default MATLAB editor. You can change the color in your [stylesheet](https://flight-manual.atom.io/using-atom/sections/basic-customization/#style-tweaks) by adding
~~~css
.variable-persistent {
  color: #82AAFF; /*Modify this value to change the color*/
}
~~~

### Planned Features
- [tree-sitter](https://github.com/tree-sitter/tree-sitter) grammar.
