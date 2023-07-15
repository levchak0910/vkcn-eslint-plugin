import { RuleTester } from "eslint";
import rule = require("../../../lib/rules/no-undefined-class-names");

import { html } from "../../utils/html";

const tester = new RuleTester({
  parser: require.resolve("vue-eslint-parser"),
  parserOptions: {
    ecmaVersion: 2019,
    sourceType: "module",
  },
  settings: { "vkcn/class-attr-name": /^(-?bar|baz|class)$/ },
});

tester.run("no-undefined-class-names", rule as any, {
  valid: [
    /* html */ `
      <template>
        <div class="foo"></div>
      </template>
      <style>
        .foo {}
      </style>
    `,
    /* html */ `
      <template>
        <div :class="'foo'"></div>
      </template>
      <style>
        .foo {}
      </style>
    `,
    /* html */ `
      <template>
        <div :class="bar === '/' ? 'foo' : ''"></div>
        <div :class="['bam'].includes('baz') ? 'foo' : 'bar'"></div>
      </template>
      <style>
        .foo {}
        .bar {}
      </style>
    `,
    /* html */ `
        <template>
          <div bar="foo" :baz="'foo'"></div>
        </template>
        <style>
          .foo {}
        </style>
      `,
    /* html */ `
      <template>
        <div :class="{foo: true, bar}"></div>
      </template>
      <style>
        .foo {}
        .bar {}
      </style>
    `,
    /* html */ `
      <template>
        <div
          :class="\`
            foo bar \${any} baz
            \${any} foobar
          \`"
        ></div>
      </template>
      <style>
        .foo, .bar, .baz, .foobar {}
      </style>
    `,
    {
      code: /* html */ `
        <template>
          <div class="bar"></div>
        </template>
        <style>
          .foo {}
        </style>
      `,
      options: [{ ignoreClassNameList: ["bar"] }],
    },
    {
      code: /* html */ `
        <template>
          <div class="foobar foobaz"></div>
        </template>
        <style>
          .foo {}
        </style>
      `,
      options: [{ ignoreClassNameRegexps: ["/^foo/"] }],
    },
  ],
  invalid: [
    {
      code: html`
        <template>
          <div class="bar"></div>
        </template>
        <style>
          .foo {
          }
        </style>
      `,
      errors: [
        {
          messageId: "undefined",
          data: { className: "bar" },
          line: 3,
          column: 13,
          endLine: 3,
          endColumn: 16,
          suggestions: [
            {
              output: html`
                <template>
                  <div class=""></div>
                </template>
                <style>
                  .foo {
                  }
                </style>
              `,
            },
            {
              output: html`
                <template>
                  <div class="foo"></div>
                </template>
                <style>
                  .foo {
                  }
                </style>
              `,
            },
          ],
        },
      ],
    },
    {
      code: html`
        <template>
          <div class="foo-bar foo"></div>
        </template>
        <style>
          .foo-bar {
          }
        </style>
      `,
      errors: [
        {
          messageId: "undefined",
          data: { className: "foo" },
          line: 3,
          column: 21,
          endLine: 3,
          endColumn: 24,
        },
      ],
    },
    {
      code: html`
        <template>
          <div :class="'bar'"></div>
        </template>
        <style>
          .foo {
          }
        </style>
      `,
      errors: [
        {
          messageId: "undefined",
          data: { className: "bar" },
          line: 3,
          column: 14,
          endLine: 3,
          endColumn: 19,
          suggestions: [
            {
              output: html`
                <template>
                  <div :class=""></div>
                </template>
                <style>
                  .foo {
                  }
                </style>
              `,
            },
            {
              output: html`
                <template>
                  <div :class="'foo'"></div>
                </template>
                <style>
                  .foo {
                  }
                </style>
              `,
            },
          ],
        },
      ],
    },
    {
      code: html`
        <template>
          <div bar="foobar" :baz="'foobaz'"></div>
        </template>
        <style>
          .foo {
          }
        </style>
      `,
      errors: [
        {
          messageId: "undefined",
          data: { className: "foobar" },
          line: 3,
          column: 11,
          endLine: 3,
          endColumn: 17,
          suggestions: [
            {
              output: html`
                <template>
                  <div bar="" :baz="'foobaz'"></div>
                </template>
                <style>
                  .foo {
                  }
                </style>
              `,
            },
            {
              output: html`
                <template>
                  <div bar="foo" :baz="'foobaz'"></div>
                </template>
                <style>
                  .foo {
                  }
                </style>
              `,
            },
          ],
        },
        {
          messageId: "undefined",
          data: { className: "foobaz" },
          line: 3,
          column: 25,
          endLine: 3,
          endColumn: 33,
          suggestions: [
            {
              output: html`
                <template>
                  <div bar="foobar" :baz=""></div>
                </template>
                <style>
                  .foo {
                  }
                </style>
              `,
            },
            {
              output: html`
                <template>
                  <div bar="foobar" :baz="'foo'"></div>
                </template>
                <style>
                  .foo {
                  }
                </style>
              `,
            },
          ],
        },
      ],
    },
    {
      code: html`
        <template>
          <div :class="{bar: true, baz}"></div>
        </template>
        <style>
          .foo {
          }
        </style>
      `,
      errors: [
        {
          messageId: "undefined",
          data: { className: "bar" },
          line: 3,
          column: 15,
          endLine: 3,
          endColumn: 18,
          suggestions: [
            {
              output: html`
                <template>
                  <div :class="{: true, baz}"></div>
                </template>
                <style>
                  .foo {
                  }
                </style>
              `,
            },
            {
              output: html`
                <template>
                  <div :class="{foo: true, baz}"></div>
                </template>
                <style>
                  .foo {
                  }
                </style>
              `,
            },
          ],
        },
        {
          messageId: "undefined",
          data: { className: "baz" },
          line: 3,
          column: 26,
          endLine: 3,
          endColumn: 29,
          suggestions: [
            {
              output: html`
                <template>
                  <div :class="{bar: true, }"></div>
                </template>
                <style>
                  .foo {
                  }
                </style>
              `,
            },
            {
              output: html`
                <template>
                  <div :class="{bar: true, foo: baz}"></div>
                </template>
                <style>
                  .foo {
                  }
                </style>
              `,
            },
          ],
        },
      ],
    },
    {
      code: /* html */ `
        <template>
          <div
            :class="\`
              foo bar \${any} baz
              \${any} foobar
            \`"
          ></div>
        </template>
        <style>
          .foo {}
        </style>
      `,
      errors: [
        {
          messageId: "undefined",
          data: { className: "bar" },
          line: 5,
          column: 19,
          endLine: 5,
          endColumn: 22,
          suggestions: [
            {
              output: `
        <template>
          <div
            :class="\`
              foo  \${any} baz
              \${any} foobar
            \`"
          ></div>
        </template>
        <style>
          .foo {}
        </style>
      `,
            },
            {
              output: `
        <template>
          <div
            :class="\`
              foo foo \${any} baz
              \${any} foobar
            \`"
          ></div>
        </template>
        <style>
          .foo {}
        </style>
      `,
            },
          ],
        },
        {
          messageId: "undefined",
          data: { className: "baz" },
          line: 5,
          column: 30,
          endLine: 5,
          endColumn: 33,
          suggestions: [
            {
              output: `
        <template>
          <div
            :class="\`
              foo bar \${any} 
              \${any} foobar
            \`"
          ></div>
        </template>
        <style>
          .foo {}
        </style>
      `,
            },
            {
              output: `
        <template>
          <div
            :class="\`
              foo bar \${any} foo
              \${any} foobar
            \`"
          ></div>
        </template>
        <style>
          .foo {}
        </style>
      `,
            },
          ],
        },
        {
          messageId: "undefined",
          data: { className: "foobar" },
          line: 6,
          column: 22,
          endLine: 6,
          endColumn: 28,
          suggestions: [
            {
              output: `
        <template>
          <div
            :class="\`
              foo bar \${any} baz
              \${any} 
            \`"
          ></div>
        </template>
        <style>
          .foo {}
        </style>
      `,
            },
            {
              output: `
        <template>
          <div
            :class="\`
              foo bar \${any} baz
              \${any} foo
            \`"
          ></div>
        </template>
        <style>
          .foo {}
        </style>
      `,
            },
          ],
        },
      ],
    },
    {
      code: /* html */ `
        <template>
          <div class="bar baz"></div>
        </template>
        <style>
          .foo {}
        </style>
      `,
      options: [{ ignoreClassNameList: ["bar"] }],
      errors: [
        {
          messageId: "undefined",
          data: { className: "baz" },
          line: 3,
          column: 27,
          endLine: 3,
          endColumn: 30,
        },
      ],
    },
    {
      code: /* html */ `
        <template>
          <div class="foobar barbaz"></div>
        </template>
        <style>
          .foo {}
        </style>
      `,
      options: [{ ignoreClassNameRegexps: ["/^foo/"] }],
      errors: [
        {
          messageId: "undefined",
          data: { className: "barbaz" },
          line: 3,
          column: 30,
          endLine: 3,
          endColumn: 36,
        },
      ],
    },
    {
      code: html`
        <template>
          <div class="foobar barbaz"></div>
        </template>
        <style>
          .foo {
          }
          .baz {
          }
        </style>
      `,
      errors: [
        {
          messageId: "undefined",
          data: { className: "foobar" },
          line: 3,
          column: 13,
          endLine: 3,
          endColumn: 19,
          suggestions: [
            {
              output: html`
                <template>
                  <div class=" barbaz"></div>
                </template>
                <style>
                  .foo {
                  }
                  .baz {
                  }
                </style>
              `,
            },
            {
              output: html`
                <template>
                  <div class="foo barbaz"></div>
                </template>
                <style>
                  .foo {
                  }
                  .baz {
                  }
                </style>
              `,
            },
            {
              output: html`
                <template>
                  <div class="baz barbaz"></div>
                </template>
                <style>
                  .foo {
                  }
                  .baz {
                  }
                </style>
              `,
            },
          ],
        },
        {
          messageId: "undefined",
          data: { className: "barbaz" },
          line: 3,
          column: 20,
          endLine: 3,
          endColumn: 26,
          suggestions: [
            {
              output: html`
                <template>
                  <div class="foobar "></div>
                </template>
                <style>
                  .foo {
                  }
                  .baz {
                  }
                </style>
              `,
            },
            {
              output: html`
                <template>
                  <div class="foobar baz"></div>
                </template>
                <style>
                  .foo {
                  }
                  .baz {
                  }
                </style>
              `,
            },
            {
              output: html`
                <template>
                  <div class="foobar foo"></div>
                </template>
                <style>
                  .foo {
                  }
                  .baz {
                  }
                </style>
              `,
            },
          ],
        },
      ],
    },
  ],
});
