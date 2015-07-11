# babel-plugin-asm-js

Compiles statically typed ES6 (Flow-flavoured) module into asm.js while preserving ES6 module interface. Still a subset of JavaScript, but much more suitable for hand-writing (so that you don't need to use C/C++ -> Emscripten -> asm.js for maths)

Work in progress.

## Currently supported:

 * ES6 `import` and named `export`
 * automatic `var`, `let`, `const` extraction and conversion
 * automatic function layout
 * function parameter annotations
 * function return type annotation
 * assignment with automatic type conversion
 * Flow type cast into asm.js type cast
 * automatic asm.js imports for stdlib and foreign references
 * automatic program layout
 * automatic wrapping into asm.js module with `initialize` for passing own `heap`

## TODO:

 * bug fixing
 * global variable support
 * string support (literals are already converted to IDs, need to support operations)
 * better asm.js<->normal code communication
 * limited object and array support

## Installation

```sh
$ npm install babel-plugin-asm-js
```

## Usage

### Via `.babelrc` (Recommended)

**.babelrc**

```json
{
  "plugins": ["asm-js"]
}
```

### Via CLI

```sh
$ babel --plugins asm-js script.js
```

### Via Node API

```javascript
require("babel-core").transform("code", {
  plugins: ["asm-js"]
});
```
