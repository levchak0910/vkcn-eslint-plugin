# vue-kebab-class-naming/no-dynamic-class-names

> disallow dynamic class names usage

## :book: Rule Details

This rule prohibit all possible dynamic class names declaration which includes:

- binding any (available in template) variable to class (_*1_) (_*2_)
- using conditional (_*3_)
- using computed property name when class declared via object
- template literal

List of allowed class usage in bind directive:

- string literal as plain or used in array
- static property name when class declared via object
- usage as `$attrs.class` or `$props.class` (=_*1_)

Exemptions (*):

_*2_ = accessing dynamic class name value is allowed via props with option: `allowProps`.

_*3_ = using conditionals is allowed via props with option: `allowConditionals`.

### :eyes: Examples

```vue
<template>
  <!-- GOOD -->
  <div class="class-name"></div>
  <div :class="['class-name']"></div>
  <div :class="{'class-name': condition}"></div>
  <div :class="$attrs.class"></div>
  <div :class="$props.class"></div>
  <!-- BAD -->
  <div :class="someClass"></div>
  <div :class="condition ? someClass : 'class-name'"></div>
  <div :class="{[someClass]: condition}"></div>
  <div :class="`class-name`"></div>
</template>

<script setup>
const someClass = "class-name"
</script>
```

## :wrench: Options

```json
{
  "vue-kebab-class-naming/no-dynamic-class-names": ["error", {
    "allowConditional": false,
    "allowProps": false,
  }]
}
```

- `allowConditional` ... Allow using conditionals, then truthy and falsy branches will be checked. Default is `false`.
- `allowProps` ... Allow using props as class name. Default is `false`.

### allowConditional = `true`

```vue
<template>
  <!-- GOOD -->
  <div :class="condition ? 'class-name1' : 'class-name2'"></div>
  <!-- BAD -->
  <div :class="condition ? someClass : 'class-name'"></div>
</template>

<script setup>
const someClass = "class-name"
</script>
```

### allowProps = `true`

```vue
<template>
  <!-- GOOD -->
  <div :class="propClass"></div>
  <!-- BAD -->
  <div :class="someClass"></div>
</template>

<script setup>
defineProps({
  propClass: String
})
const someClass = "class-name"
</script>
```
