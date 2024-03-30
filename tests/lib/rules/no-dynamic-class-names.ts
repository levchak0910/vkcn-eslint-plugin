import * as vueParser from "vue-eslint-parser";

import { RuleTester } from "../test-lib/eslint-compat";

import rule from "../../../lib/rules/no-dynamic-class-names";

const tester = new RuleTester({
  languageOptions: {
    parser: vueParser,
    ecmaVersion: 2019,
    sourceType: "module",
  },
  settings: { "@vkcn/class-attr-name": /(.+-)?class$/ },
});

type RuleOptions = {
  allowConditional: boolean;
  allowProps: boolean;
};

type Options = {
  classExpression: string;
  classAttrName: string;
  setup: boolean;
  props: string[];
  options: Partial<RuleOptions>;
};

function createCorrectTemplate(options: string | Partial<Options>) {
  /** @type {RuleOptions} */
  const ruleOptions = {
    allowConditional: false,
    allowProps: false,
  };

  const normalizedOptions: Options =
    typeof options === "string"
      ? {
          classExpression: options,
          classAttrName: "class",
          setup: false,
          props: [],
          options: ruleOptions,
        }
      : {
          classAttrName: "class",
          setup: false,
          props: [],
          classExpression: "",
          ...options,
          options: { ...ruleOptions, ...options.options },
        };

  const props = normalizedOptions.props.map((p) => `${p}: {}`).join(",");

  const script = normalizedOptions.setup
    ? `<script setup>defineProps({ ${props} })</script>`
    : `<script>export default {props: { ${props} } }</script>`;

  return {
    filename: "test.vue",
    code: `<template><div :${normalizedOptions.classAttrName}="${normalizedOptions.classExpression}"></div></template>${script}`,
    options: [normalizedOptions.options],
  };
}

function createErrorTemplate(options: string | Partial<Options>) {
  return {
    ...createCorrectTemplate(options),
    errors: ["No dynamic class."],
  };
}

tester.run("no-dynamic-class-names", rule as any, {
  valid: [
    createCorrectTemplate("'some'"),
    createCorrectTemplate("{some: true}"),
    createCorrectTemplate("{'some1 some2': true}"),
    createCorrectTemplate("{some}"),
    createCorrectTemplate("{some: some2}"),
    createCorrectTemplate("{...{some: true}}"),
    createCorrectTemplate("{...{some}}"),
    createCorrectTemplate("[{some: true}]"),
    createCorrectTemplate("$props.class"),
    createCorrectTemplate("$attrs.class"),
    createCorrectTemplate({
      classExpression: "[$props.someProp, someProp]",
      props: ["someProp"],
      options: { allowProps: true },
    }),
    createCorrectTemplate({
      classExpression: "$attrs.someProp",
      props: ["someProp"],
      options: { allowProps: true },
    }),
    createCorrectTemplate({
      classExpression: "some ? 'some1' : 'some2'",
      options: { allowConditional: true },
    }),
    createCorrectTemplate({
      classAttrName: "some-class",
      classExpression: "'some'",
    }),
  ],
  invalid: [
    createErrorTemplate("1"),
    createErrorTemplate("true"),
    createErrorTemplate("some"),
    createErrorTemplate("{[`some`]: true}"),
    createErrorTemplate("{[`some1 ${some2}`]: true}"),
    createErrorTemplate("{[some]: true}"),
    createErrorTemplate("[some]"),
    createErrorTemplate("[{some: true}, some]"),
    createErrorTemplate({
      classExpression: "[someProp1, someProp2]",
      props: ["someProp1"],
      options: { allowProps: true },
    }),
    createErrorTemplate("$props.someProp"),
    createErrorTemplate("$attrs.someProp"),
    createErrorTemplate({
      classExpression: "$props.someProp1",
      props: ["someProp2"],
      options: { allowProps: true },
    }),
    createErrorTemplate({
      classExpression: "$attrs.someProp1",
      props: ["someProp2"],
      options: { allowProps: true },
    }),
    createErrorTemplate("some ? 'some1' : 'some2'"),
    createErrorTemplate({
      classAttrName: "some-class",
      classExpression: "some",
    }),
  ],
});
