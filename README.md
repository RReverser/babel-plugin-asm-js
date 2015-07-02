# babel-plugin-flow-asm-js

Compile Flow annotated functions into asm.js

## Installation

```sh
$ npm install babel-plugin-flow-asm-js
```

## Usage

### Via `.babelrc` (Recommended)

**.babelrc**

```json
{
  "plugins": ["flow-asm-js"]
}
```

### Via CLI

```sh
$ babel --plugins flow-asm-js script.js
```

### Via Node API

```javascript
require("babel-core").transform("code", {
  plugins: ["flow-asm-js"]
});
```
