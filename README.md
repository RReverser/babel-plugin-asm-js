# babel-plugin-asm-js

Compile JavaScript + Flow into asm.js

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
