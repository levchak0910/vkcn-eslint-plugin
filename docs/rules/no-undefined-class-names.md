# vue-kebab-class-naming/no-undefined-class-names

> disallow class names using in `<template>` that are not defined in `<style>`

## :book: Rule Details

This rule reports class names used in `<template>` but not defined in `<style>`.

This rule statically analyzes class selectors among the selectors defined in `<style>`.

_Tip_: when class is defined in `<style>` but mistyped in `<template>` - use eslint suggestions to select one of defined class names

### :eyes: Examples

```vue
<template>
  <!-- ✗ BAD -->
  <div class="class-a"></div>
  <div class="class-c"></div>
  <!-- ✓ GOOD -->
  <div class="class-b"></div>
</template>

<style>
.class-b {}
</style>
```

## :wrench: Options

```json
{
  "vue-kebab-class-naming/no-undefined-class-names": ["error", {
    "ignoreClassNames": [],
  }]
}
```

- `ignoreClassNames` ... Array of class names as a string or a regular expression (as a string) that are considered to be ignored. Default is `[]`.

### `"ignoreClassNames": ["class-c", "/^tw-/"]`

```vue
<template>
  <!-- ✗ BAD -->
  <div class="class-a"></div>
  <div class="class-d"></div>
  <!-- ✓ GOOD -->
  <div class="class-b"></div>
  <div class="class-c"></div>
  <div class="tw-text-red tw-bg-green"></div>
</template>

<style>
.class-b {}
</style>
```

## :trophy: Additional recommended  rules

- [vue-scoped-css/no-unused-selector](https://future-architect.github.io/eslint-plugin-vue-scoped-css/rules/no-unused-selector.html)
- [vue-scoped-css/require-selector-used-inside](https://future-architect.github.io/eslint-plugin-vue-scoped-css/rules/require-selector-used-inside.html)
