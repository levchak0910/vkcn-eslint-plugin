# vue-kebab-class-naming/no-undefined-class-names

> disallow class names using in `<template>` that are not defined in `<style>`

## :book: Rule Details

This rule reports class names used in `<template>` but not defined in `<style>`.

This rule statically analyzes class selectors among the selectors defined in `<style>`.

_Tip_: when class is defined in `<style>` but mistyped in `<template>` - use eslint suggestions to select one of defined class names

## :wrench: Options

```json
{
  "vue-kebab-class-naming/no-undefined-class-names": ["error", {
    "classAttrNameList": [],
    "classAttrNameRegexp": "",
    "ignoreClassNameList": [],
    "ignoreClassNameRegexps": [],
  }]
}
```

- `classAttrNameList` ... Array of additional attribute names (as a string) that are considered to be checked. Default is `[]`.
- `classAttrNameRegexp` ... Regexp (as a string) for matching all attribute names that are considered to be checked. Default is `undefined`. When using this option
  - **include** `class` into your regexp
  - `classAttrNameList` is **ignored**
- `ignoreClassNameList` ... Array of class names (as a string) that are considered to be ignored. Default is `[]`.
- `ignoreClassNameRegexps` ... Array of regular expressions (as a string) that will be checked against the class names that are considered to be ignored. Default is `[]`.

### `"classAttrNameList": ["prop-class"]`

```vue
<template>
  <!-- ✗ BAD -->
  <div class="class-a"></div>
  <AnyComponent prop-class="class-a"></AnyComponent>
  <!-- ✓ GOOD -->
  <div class="class-b"></div>
  <AnyComponent prop-class="class-b"></AnyComponent>
</template>

<style>
.class-b {}
</style>
```

### `"classAttrNameRegexp": "/-class$/", "classAttrNameList": ["prop-class-name"]`

```vue
<template>
  <!-- ✗ BAD -->
  <AnyComponent prop1-class="class-a"></AnyComponent>
  <AnyComponent prop2-class="class-a"></AnyComponent>
  <!-- ✓ GOOD -->
  <AnyComponent prop1-class="class-b"></AnyComponent>
  <AnyComponent prop2-class="class-b"></AnyComponent>
  <div class="class-a"></div> <!-- Not checked! -->
  <AnyComponent prop-class-name="class-a"></AnyComponent> <!-- Not checked! -->
</template>

<style>
.class-b {}
</style>
```

### `"ignoreClassNameList": ["class-c"]`

```vue
<template>
  <!-- ✗ BAD -->
  <div class="class-a"></div>
  <div class="class-d"></div>
  <!-- ✓ GOOD -->
  <div class="class-b"></div>
  <div class="class-c"></div>
</template>

<style>
.class-b {}
</style>
```

### `"ignoreClassNameRegexps": ["/^tw-/"]`

```vue
<template>
  <!-- ✗ BAD -->
  <div class="class-a"></div>
  <!-- ✓ GOOD -->
  <div class="class-b"></div>
  <div class="tw-text-center tw-bg-white"></div>
</template>

<style>
.class-b {}
</style>
```

## :trophy: Additional recommended  rules

- [vue-scoped-css/no-unused-selector](https://future-architect.github.io/eslint-plugin-vue-scoped-css/rules/no-unused-selector.html)
- [vue-scoped-css/require-selector-used-inside](https://future-architect.github.io/eslint-plugin-vue-scoped-css/rules/require-selector-used-inside.html)
