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

## :wrench: Options

```json
{
  "vue-kebab-class-naming/no-dynamic-class-names": ["error", {
    "allowConditional": false,
    "allowProps": false,
    "classAttrNames": [],
  }]
}
```

- `allowConditional` ... Allow using conditionals, then truthy and falsy branches will be checked. Default is `false`.
- `allowProps` ... Allow using props as class name. Default is `false`.
- `classAttrNames` ... List of all additional property names where to check dynamic class names usage. Could contain exact property name as string or regexp. Default is `[]`.
