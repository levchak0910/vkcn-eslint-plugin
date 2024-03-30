import * as vueParser from "vue-eslint-parser";

import { RuleTester } from "../test-lib/eslint-compat";

import rule = require("../../../lib/rules/no-convention-violation");

import { html } from "../../utils/html";

const tester = new RuleTester({
  languageOptions: {
    parser: vueParser,
    ecmaVersion: 2019,
    sourceType: "module",
  },
});

tester.run("no-convention-violation", rule as any, {
  valid: [
    {
      filename: "FooComponent.vue",
      code: /* html */ `
        <style>
          /* vkcn-prefix foo-baz */
          .foo-baz--bar {}
        </style>
        <style>
          /* vkcn-prefix foo--baz */
          .foo-component--bar {}
        </style>
      
        <style lang="scss">
          // vkcn-prefix foo-baz
          .foo-baz--bam {}
        </style>
        <style lang="scss">
          // vkcn-prefix foo--baz
          .foo-component--bam {}
        </style>
      `,
    },
    {
      filename: "FooComponent.vue",
      code: /* html */ `
        <style>
          .foo-component--bar > div {}
        </style>
        <style lang="scss">
          .foo-component--baz {
            & > div {}
          }
        </style>
      `,
    },
    {
      filename: "./bar/FooComponent/index.vue",
      code: /* html */ `
        <style>
          .foo-component--bar > div {}
        </style>
        <style lang="scss">
          .foo-component--baz {
            & > div {}
          }
        </style>
      `,
    },
    {
      filename: "FooComponent.vue",
      code: /* html */ `
        <style>
          .foo-component--bar > * {}
        </style>
        <style lang="scss">
          .foo-component--baz {
            & > * {}
          }
        </style>
      `,
    },
    {
      filename: "FooComponent.vue",
      code: /* html */ `
        <style>
          .foo-component--bar:hover {}
        </style>
        <style lang="scss">
          .foo-component--bar {
            &:hover {}
            &:disabled:not(.baz) {}
          }
        </style>
      `,
    },
    {
      filename: "FooComponent.vue",
      options: [{ allowTopLevelNonClassSelector: true }],
      code: /* html */ `
        <style>
          :hover {}
          ::selection {}
          * {}
          [data-foo] {}
          div {}
          #foo {}
        </style>
      `,
    },
    {
      filename: "FooComponent.vue",
      code: html`
        <style lang="scss">
          .foo-component--bar {
            &:first-child:hover {
            }
            &.bar:first-child:hover {
            }
          }
        </style>
      `,
    },
    {
      filename: "FooComponent.vue",
      code: /* html */ `
        <style>
          .foo-component--bar[src="baz"] {}
        </style>
        <style lang="scss">
          .foo-component--bar {
            &[src="baz"] {}
          }
        </style>
      `,
    },
    {
      filename: "FooComponent.vue",
      code: /* html */ `
        <style>
          .foo-component--bar.baz {}
          .foo-component--bar.baz.bam.bal {}
        </style>
        <style lang="scss">
          .foo-component--bar {
            &.baz {}
            &.baz.bam.bal {}
          }
        </style>
      `,
    },
  ],
  invalid: [
    {
      filename: "FooComponent.vue",
      code: html`
        <style>
          .foo-component--bar__baz {
          }
          .foo-component--__baz {
          }
        </style>
        <style lang="scss">
          .foo-component--bar {
            &__baz {
            }
          }
        </style>
      `,
      errors: [
        {
          messageId: "class-top-naming",
          line: 3,
          column: 1,
          endLine: 3,
          endColumn: 25,
          suggestions: [
            {
              output: html`
                <style>
                  .foo-component--bar-baz {
                  }
                  .foo-component--__baz {
                  }
                </style>
                <style lang="scss">
                  .foo-component--bar {
                    &__baz {
                    }
                  }
                </style>
              `,
            },
          ],
        },
        {
          messageId: "class-top-naming",
          line: 5,
          column: 1,
          endLine: 5,
          endColumn: 22,
          suggestions: [
            {
              output: html`
                <style>
                  .foo-component--bar__baz {
                  }
                  .foo-component--baz {
                  }
                </style>
                <style lang="scss">
                  .foo-component--bar {
                    &__baz {
                    }
                  }
                </style>
              `,
            },
          ],
        },
        {
          messageId: "class-top-naming",
          line: 10,
          column: 1,
          endLine: 10,
          endColumn: 7,
          suggestions: [],
        },
      ],
    },
    {
      filename: "FooComponent.vue",
      code: html`
        <style lang="scss">
          .foo-component--bar {
            & > div {
              &__baz {
              }
            }
          }
        </style>
      `,
      errors: [
        {
          messageId: "type-nested",
          line: 5,
          column: 1,
          endLine: 5,
          endColumn: 7,
        },
      ],
    },
    {
      filename: "FooComponent.vue",
      code: html`
        <style>
          .foo-component--bar * {
          }
        </style>
      `,
      errors: [
        {
          messageId: "combinator-type-allowed",
          line: 3,
          column: 20,
          endLine: 3,
          endColumn: 21,
        },
        {
          messageId: "universal-invalid-parent",
          line: 3,
          column: 21,
          endLine: 3,
          endColumn: 22,
        },
      ],
    },
    {
      filename: "FooComponent.vue",
      code: html`
        <style lang="scss">
          .foo-component--bar {
            &.baz {
              &.bam {
              }
            }
          }
        </style>
      `,
      errors: [
        {
          messageId: "class-nested-modifiers",
          line: 5,
          column: 2,
          endLine: 5,
          endColumn: 6,
        },
      ],
    },
  ],
});
