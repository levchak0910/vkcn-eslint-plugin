# eslint-plugin-vue-kebab-class-naming

[eslint-plugin-vue-kebab-class-naming](https://www.npmjs.com/package/eslint-plugin-vue-kebab-class-naming) is an ESLint plugin for ensuring a kebab-ish like class naming convention.

This convention was invited and relates only to this plugin. The convention was created to solve styles encapsulation via class naming. The description of the convention can be found in [rule documentation](./docs/rules/no-convention-violation.md).

## Features

This ESLint plugin provides linting rules related to better class names usage.

- Provides linting rules for Vue template and style blocks.
- Supports plain CSS and SCSS.
- Parses `<style>` and `<template>` blocks.
- ~~Mostly copied~~ Highly inspired by [eslint-plugin-vue-scoped-css](https://future-architect.github.io/eslint-plugin-vue-scoped-css/)

## Installation

Prerequisite: [eslint](https://eslint.org/) and [eslint-plugin-vue](https://eslint.vuejs.org/) are already installed

```bash
npm install --save-dev eslint-plugin-vue-kebab-class-naming
# or
yarn add --dev eslint-plugin-vue-kebab-class-naming
```

## Usage

Edit `.eslintrc.*` file to configure rules. See also: [http://eslint.org/docs/user-guide/configuring](http://eslint.org/docs/user-guide/configuring).

Example **.eslintrc.js**:

```js
module.exports = {
  plugins: ['vue-kebab-class-naming'],
  rules: {
    'vue-kebab-class-naming/<rule-name>': 'error'
  }
}
```

### Recommended usage

_Please note!_ Recommended set of rules includes several eslint plugins, which are out of this plugin's scope, so install them separately.

```js
module.exports = {
  parser: "vue-eslint-parser",
  plugins: [
    'vue',
    'vue-scoped-css',
    'vue-kebab-class-naming',
  ],
  rules: {
    "vue/no-useless-v-bind": "error",
    "vue/prefer-separate-static-class": "error",

    "vue-scoped-css/enforce-style-type": ["error", { allows: ["plain"] }],
    "vue-scoped-css/no-unused-selector": ["error", { checkUnscoped: true }],
    "vue-scoped-css/require-selector-used-inside": ["error", { checkUnscoped: true }],

    'vue-kebab-class-naming/no-convention-violation': ["error", { enableFix: true }],
    'vue-kebab-class-naming/no-dynamic-class-names': "error",
    'vue-kebab-class-naming/no-undefined-class-names': "error",
  }
}
```

## Available rules

The `--fix` option on the [command line](https://eslint.org/docs/user-guide/command-line-interface#fixing-problems) automatically fixes problems reported by rules which have a wrench :wrench: below.

| Rule ID | Description |    |
|:--------|:------------|:---|
| [vue-kebab-class-naming/no-dynamic-class-names](./docs/rules/no-dynamic-class-names.md) | disallow dynamic class names usage | |
| [vue-kebab-class-naming/no-undefined-class-names](./docs/rules/no-undefined-class-names.md) | disallow class names using in `<template>` that are not defined in `<style>` | :wrench: |
| [vue-kebab-class-naming/no-convention-violation](./docs/rules/no-convention-violation.md) | enforce css/scss code style | :wrench: |

## Contributing

Welcome contributing!

Please use GitHub's Issues/PRs.

### Development Tools

- `yarn test` runs tests and measures coverage.
- `yarn t tests/lib/rules/<rule-name>.ts` runs all tests for selected rule.
- put `debugger` statement in lib code and run task "Debug tests" in VS Code "Run and Debug" tab

## License

See the [LICENSE](LICENSE) file for license rights and limitations (MIT).

Huge thanks to [Yosuke Ota](https://github.com/ota-meshi) for creating [eslint-plugin-vue-scoped-css](https://future-architect.github.io/eslint-plugin-vue-scoped-css/) which enabled this eslint plugin creation.
