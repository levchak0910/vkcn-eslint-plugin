"use strict";

module.exports = {
  parserOptions: {
    sourceType: "script",
    ecmaVersion: 2018,
  },
  extends: [
    "plugin:@ota-meshi/recommended",
    "plugin:@ota-meshi/+node",
    "plugin:@ota-meshi/+typescript",
    "plugin:@ota-meshi/+eslint-plugin",
    "plugin:@ota-meshi/+json",
    "plugin:@ota-meshi/+yaml",
    "plugin:@ota-meshi/+prettier",
    "plugin:node-dependencies/recommended",
  ],
  rules: {
    "require-jsdoc": "off",
    "no-warning-comments": "warn",
    "no-lonely-if": "off",
    "@typescript-eslint/ban-ts-ignore": "off",
    "eslint-comments/no-unused-disable": "error",
    "@typescript-eslint/no-non-null-assertion": "off",
    complexity: "off",
    "@typescript-eslint/unbound-method": "off",

    "prettier/prettier": [
      "error",
      {
        singleQuote: false,
        trailingComma: "all",
      },
    ],
    "eslint-plugin/test-case-property-ordering": [
      "error",
      ["name", "filename", "settings", "options", "code"],
    ],
    // Repo rule
    "@typescript-eslint/no-restricted-imports": [
      "error",
      {
        patterns: [
          {
            group: ["/regexpp", "/regexpp/*"],
            message: "Please use `@eslint-community/regexpp` instead.",
          },
          {
            group: ["/eslint-utils", "/eslint-utils/*"],
            message: "Please use `@eslint-community/eslint-utils` instead.",
          },
        ],
      },
    ],
    "no-restricted-properties": [
      "error",
      {
        object: "context",
        property: "getSourceCode",
        message: "Use src/utils/compat.ts",
      },
      {
        object: "context",
        property: "getFilename",
        message: "Use src/utils/compat.ts",
      },
      {
        object: "context",
        property: "getPhysicalFilename",
        message: "Use src/utils/compat.ts",
      },
      {
        object: "context",
        property: "getCwd",
        message: "Use src/utils/compat.ts",
      },
      {
        object: "context",
        property: "getScope",
        message: "Use src/utils/compat.ts",
      },
      {
        object: "context",
        property: "parserServices",
        message: "Use src/utils/compat.ts",
      },
    ],
  },
  overrides: [
    {
      files: ["*.ts", "*.mts"],
      parser: "@typescript-eslint/parser",
      rules: {
        "@typescript-eslint/no-require-imports": "off",
        "@typescript-eslint/no-var-requires": "off",
        "no-implicit-globals": "off",
      },
      parserOptions: {
        sourceType: "module",
        project: "./tsconfig.json",
      },
    },
    {
      files: ["lib/rules/**"],
      rules: {
        "eslint-plugin/report-message-format": ["error", "[^a-z].*\\.$"],
        "eslint-plugin/require-meta-docs-url": [
          "warn",
          {
            pattern:
              "https://github.com/levchak0910/eslint-plugin-vue-kebab-class-naming/blob/main/docs/rules/{{name}}.md",
          },
        ],
        "eslint-plugin/require-meta-has-suggestions": "off", // false positive

        "@typescript-eslint/naming-convention": [
          "error",
          {
            selector: "default",
            format: ["camelCase"],
            leadingUnderscore: "allow",
            trailingUnderscore: "allow",
          },
          {
            selector: "variable",
            format: ["camelCase", "UPPER_CASE"],
            leadingUnderscore: "allow",
            trailingUnderscore: "allow",
          },
          {
            selector: "typeLike",
            format: ["PascalCase"],
          },
          {
            selector: "property",
            format: null,
          },
          {
            selector: "method",
            format: null,
          },
        ],
      },
    },
    {
      files: ["scripts/*.js", "tests/**/*.js", "scripts/*.ts", "tests/**/*.ts"],
      rules: {
        "no-console": "off",
      },
    },
    {
      files: ["lib/utils/ts-utils/*.js"],
      rules: {
        "no-shadow": "off",
        "default-case": "off",
      },
    },
  ],
};
