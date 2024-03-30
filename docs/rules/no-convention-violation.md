# @vkcn/no-convention-violation

> enforce css/scss code style

## :book: Rule Details

This rule enforce to write stylesheet code by several rules:

- the only top level selector allowed - class
- there are 2 types of class selector: `element` and `modifier`
- class names should be written in kebab case
- type selectors are allowed only as a direct child of `element`
- pseudo selectors are allowed at the end of `element` or `modifier`
- several [nesting](#nesting) rules

Supports both `css` and `scss` syntaxes

### Class selectors

#### Element class

Can be applied only 1 per 1 DOM element

Name should follow pattern `<prefix>--<element>`, where

- prefix - used to make element classes uniq across the application
  - by default
    1. equals to file name
    2. if file called as `index` then equals to containing folder name
  - can be overwritten with `@vkcn/prefix` comment
- element - any custom name which is appropriate for DOM element

Element selector can not contain other element selector

Should be declared on `class` attribute (`class="<prefix>--<element>"`), not bind directive (`:class="'<prefix>--<element>'"` or `:class="['<prefix>--<element>', '<modifier>']"`) or ``:class="`<prefix>--<element> <modifier>`"``. _Tip_: use with [vue/prefer-separate-static-class](https://eslint.vuejs.org/rules/prefer-separate-static-class.html)

##### Prefix rules

Prefix overwrite all element class selectors per file

Should be declared by pattern `@vkcn/prefix <any-appropriate-name>`. Recommended to place at the begging of the style tag

non kebab case prefix will be _ignored_ and fallback to default naming

##### :eyes: Examples

- `SomeComponentName.vue`

```html
<style>
.some-component-name--some-element {}
</style>
```

- `SomeComponentName/index.vue`

```html
<style>
.some-component-name--some-element {}
</style>
```

- `SomeComponentName.vue`

```html
<style>
/* @vkcn/prefix some-better-name */
.some-better-name--some-element {}
</style>
```

```html
<style lang="scss">
// @vkcn/prefix some-better-name
.some-better-name--some-element {}
</style>
```

#### Modifier class

Used to extend element's base rules

Preferably should be single-word (best works with single-word declared in template, `:class="{ disabled }"`)

For multi-word classes kebab case must be used `:class="{ 'primary-color': primaryColor }"`

Modifiers can be nested only once

Modifiers can not be applied to type elements

##### :eyes: Examples

```css
.some-component-name--some-element {}
.some-component-name--some-element.modifier {}
.some-component-name--some-element.some-modifier.another-modifier {}
```

```scss
.some-component-name--some-element {
  &.modifier {}
  &.some-modifier.another-modifier {}
}
```

### Nesting

Nesting can be used only

1. to extend `element` with
   - `modifier` class
   - pseudo selector
   - attribute selector
   - `@media` at-rule
   - `@include` at-rule

2. to select direct element's child type selector

3. to extend `modifier` with
   - pseudo selector
   - attribute selector

##### :eyes: Examples

```scss
// 1
.some-component-name--some-element {
  @include some-mixin;
  &.modifier {}
  &:hover {}
  &[disabled] {}
  @media screen {}
}
```

```scss
// 2
.some-component-name--some-element {
  > div {}
}
```

```scss
// 3
.some-component-name--some-element {
  &.modifier {
    &:hover {}
    &[disabled] {}
  }
}
```

## :wrench: Options

```json
{
  "@vkcn/no-convention-violation": ["error", {
   "allowTopLevelNonClassSelector": false,
   "enableFix": false,
  }]
}
```

- `allowTopLevelNonClassSelector` ... A way to disable violation check for all top level non class selectors. Default is `false`.
- `enableFix` ... Enables auto fixing for prefix of `element` class names. Recommended to enable when starting application from scratch. Default is `false`.

_Tip_: when auto fix disabled - use eslint suggestions for correct `element` class name.

## :trophy: Additional recommended  rules

- [vue/no-useless-v-bind](https://eslint.vuejs.org/rules/no-useless-v-bind.html)
- [vue/prefer-separate-static-class](https://eslint.vuejs.org/rules/prefer-separate-static-class.html)
