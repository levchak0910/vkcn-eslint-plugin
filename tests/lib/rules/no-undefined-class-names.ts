import { RuleTester } from "eslint";
import rule = require("../../../lib/rules/no-undefined-class-names");

import { html } from "../../utils/html";

const tester = new RuleTester({
  parser: require.resolve("vue-eslint-parser"),
  parserOptions: {
    ecmaVersion: 2019,
    sourceType: "module",
  },
});

tester.run("no-undefined-class-names", rule as any, {
  valid: [
    {
      name: "static attribute",
      filename: "app.vue",
      code: html`
        <template>
          <div class="app--foo bar"></div>
        </template>
        <style>
          .app--foo,
          .app--foo.bar {
          }
        </style>
      `,
    },
    {
      name: "dynamic attribute",
      filename: "app.vue",
      code: html`
        <template>
          <div :class="'app--foo bar'"></div>
          <div :class="['app--foo', 'bar']"></div>
        </template>
        <style>
          .app--foo,
          .app--foo.bar {
          }
        </style>
      `,
    },
    {
      name: "default conditional",
      filename: "app.vue",
      code: html`
        <template>
          <div
            class="app--foo"
            :class="'app--bam' === '/' ? 'bar' : 'baz'"
          ></div>
        </template>
        <style>
          .app--foo,
          .app--foo.bar,
          .app--foo.baz {
          }
        </style>
      `,
    },
    {
      name: "custom attribute names",
      filename: "app.vue",
      settings: { "vkcn/class-attr-name": /^(bar|baz)$/ },
      code: html`
        <template>
          <div bar="app--foo" :baz="'app--foo'"></div>
        </template>
        <style>
          .app--foo {
          }
        </style>
      `,
    },
    {
      name: "classes as object",
      filename: "app.vue",
      code: html`
        <template>
          <div
            :class="{'app--foo': true, bar, baz: condition, 'bam': 'app--foo' === '/'}"
          ></div>
        </template>
        <style>
          .app--foo,
          .app--foo.bar,
          .app--foo.baz,
          .app--foo.bam {
          }
        </style>
      `,
    },
    {
      name: "template literals",
      filename: "app.vue",
      code: html`
        <template>
          <div
            :class="\`
               app--foo bar \${any} baz
               \${any} foobar
             \`"
          ></div>
        </template>
        <style>
          .app--foo,
          .app--foo.bar,
          .app--foo.baz,
          .app--foo.foobar {
          }
        </style>
      `,
    },
    {
      name: "option: ignoreClassNames as string or regexp",
      filename: "app.vue",
      options: [{ ignoreClassNames: ["app--bar", "/^app--foo/"] }],
      code: html`
        <template>
          <div class="app--bar"></div>
          <div class="app--foobar"></div>
          <div class="app--foobaz"></div>
        </template>
        <style>
          .app--foo {
          }
        </style>
      `,
    },
  ],
  invalid: [
    {
      name: "element class not used",
      filename: "app.vue",
      code: html`
        <template>
          <div class="foo"></div>
          <div :class="'bar'"></div>
        </template>
      `,
      errors: [
        {
          messageId: "invalid-element",
          line: 3,
          column: 6,
          endLine: 3,
          endColumn: 17,
        },
        {
          messageId: "invalid-element",
          line: 4,
          column: 6,
          endLine: 4,
          endColumn: 20,
        },
      ],
    },
    {
      name: "undefined element in static attribute",
      filename: "app.vue",
      code: html`
        <template>
          <div class="app--bar"></div>
        </template>
        <style>
          .app--foo {
          }
        </style>
      `,
      errors: [
        {
          messageId: "undefined-element",
          data: { className: "app--bar" },
          line: 3,
          column: 13,
          endLine: 3,
          endColumn: 21,
          suggestions: [
            {
              output: html`
                <template>
                  <div class=""></div>
                </template>
                <style>
                  .app--foo {
                  }
                </style>
              `,
            },
            {
              output: html`
                <template>
                  <div class="app--foo"></div>
                </template>
                <style>
                  .app--foo {
                  }
                </style>
              `,
            },
          ],
        },
      ],
    },
    {
      name: "undefined modifier in static attribute",
      filename: "app.vue",
      code: html`
        <template>
          <div class="app--foo baz"></div>
        </template>
        <style>
          .app--foo,
          .app--foo.bar {
          }
        </style>
      `,
      errors: [
        {
          messageId: "undefined-modifier",
          data: { className: "baz" },
          line: 3,
          column: 22,
          endLine: 3,
          endColumn: 25,
          suggestions: [
            {
              output: html`
                <template>
                  <div class="app--foo "></div>
                </template>
                <style>
                  .app--foo,
                  .app--foo.bar {
                  }
                </style>
              `,
            },
            {
              output: html`
                <template>
                  <div class="app--foo bar"></div>
                </template>
                <style>
                  .app--foo,
                  .app--foo.bar {
                  }
                </style>
              `,
            },
          ],
        },
      ],
    },
    {
      name: "undefined element in dynamic attribute",
      filename: "app.vue",
      code: html`
        <template>
          <div :class="'app--bar'"></div>
          <div :class="['app--baz']"></div>
        </template>
        <style>
          .app--foo {
          }
        </style>
      `,
      errors: [
        {
          messageId: "undefined-element",
          data: { className: "app--bar" },
          line: 3,
          column: 14,
          endLine: 3,
          endColumn: 24,
          suggestions: [
            {
              output: html`
                <template>
                  <div :class=""></div>
                  <div :class="['app--baz']"></div>
                </template>
                <style>
                  .app--foo {
                  }
                </style>
              `,
            },
            {
              output: html`
                <template>
                  <div :class="'app--foo'"></div>
                  <div :class="['app--baz']"></div>
                </template>
                <style>
                  .app--foo {
                  }
                </style>
              `,
            },
          ],
        },
        {
          messageId: "undefined-element",
          data: { className: "app--baz" },
          line: 4,
          column: 15,
          endLine: 4,
          endColumn: 25,
          suggestions: [
            {
              output: html`
                <template>
                  <div :class="'app--bar'"></div>
                  <div :class="[]"></div>
                </template>
                <style>
                  .app--foo {
                  }
                </style>
              `,
            },
            {
              output: html`
                <template>
                  <div :class="'app--bar'"></div>
                  <div :class="['app--foo']"></div>
                </template>
                <style>
                  .app--foo {
                  }
                </style>
              `,
            },
          ],
        },
      ],
    },
    {
      name: "undefined modifier in dynamic attribute",
      filename: "app.vue",
      code: html`
        <template>
          <div :class="'app--foo bar baz'"></div>
          <div :class="['app--foo', 'bar', 'bam']"></div>
        </template>
        <style>
          .app--foobar,
          .app--foobar.barbaz,
          .app--foo,
          .app--foo.bar {
          }
        </style>
      `,
      errors: [
        {
          messageId: "undefined-modifier",
          data: { className: "baz" },
          line: 3,
          column: 28,
          endLine: 3,
          endColumn: 31,
          suggestions: [
            {
              output: html`
                <template>
                  <div :class="'app--foo bar '"></div>
                  <div :class="['app--foo', 'bar', 'bam']"></div>
                </template>
                <style>
                  .app--foobar,
                  .app--foobar.barbaz,
                  .app--foo,
                  .app--foo.bar {
                  }
                </style>
              `,
            },
            {
              output: html`
                <template>
                  <div :class="'app--foo bar bar'"></div>
                  <div :class="['app--foo', 'bar', 'bam']"></div>
                </template>
                <style>
                  .app--foobar,
                  .app--foobar.barbaz,
                  .app--foo,
                  .app--foo.bar {
                  }
                </style>
              `,
            },
          ],
        },
        {
          messageId: "undefined-modifier",
          data: { className: "bam" },
          line: 4,
          column: 34,
          endLine: 4,
          endColumn: 39,
          suggestions: [
            {
              output: html`
                <template>
                  <div :class="'app--foo bar baz'"></div>
                  <div :class="['app--foo', 'bar', ]"></div>
                </template>
                <style>
                  .app--foobar,
                  .app--foobar.barbaz,
                  .app--foo,
                  .app--foo.bar {
                  }
                </style>
              `,
            },
            {
              output: html`
                <template>
                  <div :class="'app--foo bar baz'"></div>
                  <div :class="['app--foo', 'bar', 'bar']"></div>
                </template>
                <style>
                  .app--foobar,
                  .app--foobar.barbaz,
                  .app--foo,
                  .app--foo.bar {
                  }
                </style>
              `,
            },
          ],
        },
      ],
    },
    {
      name: "undefined with custom attribute names",
      filename: "app.vue",
      settings: { "vkcn/class-attr-name": /^(bar|baz)$/ },
      code: html`
        <template>
          <div bar="app--foobar" :baz="'app--foobaz'"></div>
          <div class="app--bam"></div>
        </template>
        <style>
          .app--foo {
          }
        </style>
      `,
      errors: [
        {
          messageId: "undefined-element",
          data: { className: "app--foobar" },
          line: 3,
          column: 11,
          endLine: 3,
          endColumn: 22,
          suggestions: [
            {
              output: html`
                <template>
                  <div bar="" :baz="'app--foobaz'"></div>
                  <div class="app--bam"></div>
                </template>
                <style>
                  .app--foo {
                  }
                </style>
              `,
            },
            {
              output: html`
                <template>
                  <div bar="app--foo" :baz="'app--foobaz'"></div>
                  <div class="app--bam"></div>
                </template>
                <style>
                  .app--foo {
                  }
                </style>
              `,
            },
          ],
        },
        {
          messageId: "undefined-element",
          data: { className: "app--foobaz" },
          line: 3,
          column: 30,
          endLine: 3,
          endColumn: 43,
          suggestions: [
            {
              output: html`
                <template>
                  <div bar="app--foobar" :baz=""></div>
                  <div class="app--bam"></div>
                </template>
                <style>
                  .app--foo {
                  }
                </style>
              `,
            },
            {
              output: html`
                <template>
                  <div bar="app--foobar" :baz="'app--foo'"></div>
                  <div class="app--bam"></div>
                </template>
                <style>
                  .app--foo {
                  }
                </style>
              `,
            },
          ],
        },
      ],
    },
    {
      name: "undefined classes in object",
      filename: "app.vue",
      code: html`
        <template>
          <div
            :class="{'app--foo': true, bar: condition, baz, 'bam': condition}"
          ></div>
        </template>
        <style>
          .app--foo,
          .app--foo.foo {
          }
        </style>
      `,
      errors: [
        {
          messageId: "undefined-modifier",
          data: { className: "bar" },
          line: 4,
          column: 28,
          endLine: 4,
          endColumn: 31,
          suggestions: [
            {
              output: html`
                <template>
                  <div
                    :class="{'app--foo': true, : condition, baz, 'bam': condition}"
                  ></div>
                </template>
                <style>
                  .app--foo,
                  .app--foo.foo {
                  }
                </style>
              `,
            },
            {
              output: html`
                <template>
                  <div
                    :class="{'app--foo': true, foo: condition, baz, 'bam': condition}"
                  ></div>
                </template>
                <style>
                  .app--foo,
                  .app--foo.foo {
                  }
                </style>
              `,
            },
          ],
        },
        {
          messageId: "undefined-modifier",
          data: { className: "baz" },
          line: 4,
          column: 44,
          endLine: 4,
          endColumn: 47,
          suggestions: [
            {
              output: html`
                <template>
                  <div
                    :class="{'app--foo': true, bar: condition, , 'bam': condition}"
                  ></div>
                </template>
                <style>
                  .app--foo,
                  .app--foo.foo {
                  }
                </style>
              `,
            },
            {
              output: html`
                <template>
                  <div
                    :class="{'app--foo': true, bar: condition, foo: baz, 'bam': condition}"
                  ></div>
                </template>
                <style>
                  .app--foo,
                  .app--foo.foo {
                  }
                </style>
              `,
            },
          ],
        },
        {
          messageId: "undefined-modifier",
          data: { className: "bam" },
          line: 4,
          column: 49,
          endLine: 4,
          endColumn: 54,
          suggestions: [
            {
              output: html`
                <template>
                  <div
                    :class="{'app--foo': true, bar: condition, baz, : condition}"
                  ></div>
                </template>
                <style>
                  .app--foo,
                  .app--foo.foo {
                  }
                </style>
              `,
            },
            {
              output: html`
                <template>
                  <div
                    :class="{'app--foo': true, bar: condition, baz, 'foo': condition}"
                  ></div>
                </template>
                <style>
                  .app--foo,
                  .app--foo.foo {
                  }
                </style>
              `,
            },
          ],
        },
      ],
    },
    {
      name: "undefined in template literal",
      filename: "app.vue",
      options: [{ ignoreClassNames: ["__"] }],
      code: html`
        <template>
          <div
            :class="\`
              app--foo bar \${any} baz __
              \${any} foobar __
            \`"
          ></div>
        </template>
        <style>
          .app--foo,
          .app--foo.bam {
          }
        </style>
      `,
      errors: [
        {
          messageId: "undefined-modifier",
          data: { className: "bar" },
          line: 5,
          column: 10,
          endLine: 5,
          endColumn: 13,
          suggestions: [
            {
              output: html`
                <template>
                  <div
                    :class="\`
                      app--foo  \${any} baz __
                      \${any} foobar __
                    \`"
                  ></div>
                </template>
                <style>
                  .app--foo,
                  .app--foo.bam {
                  }
                </style>
              `,
            },
            {
              output: html`
                <template>
                  <div
                    :class="\`
                      app--foo bam \${any} baz __
                      \${any} foobar __
                    \`"
                  ></div>
                </template>
                <style>
                  .app--foo,
                  .app--foo.bam {
                  }
                </style>
              `,
            },
          ],
        },
        {
          messageId: "undefined-modifier",
          data: { className: "baz" },
          line: 5,
          column: 21,
          endLine: 5,
          endColumn: 24,
          suggestions: [
            {
              output: html`
                <template>
                  <div
                    :class="\`
                      app--foo bar \${any}  __
                      \${any} foobar __
                    \`"
                  ></div>
                </template>
                <style>
                  .app--foo,
                  .app--foo.bam {
                  }
                </style>
              `,
            },
            {
              output: html`
                <template>
                  <div
                    :class="\`
                      app--foo bar \${any} bam __
                      \${any} foobar __
                    \`"
                  ></div>
                </template>
                <style>
                  .app--foo,
                  .app--foo.bam {
                  }
                </style>
              `,
            },
          ],
        },
        {
          messageId: "undefined-modifier",
          data: { className: "foobar" },
          line: 6,
          column: 8,
          endLine: 6,
          endColumn: 14,
          suggestions: [
            {
              output: html`
                <template>
                  <div
                    :class="\`
                      app--foo bar \${any} baz __
                      \${any}  __
                    \`"
                  ></div>
                </template>
                <style>
                  .app--foo,
                  .app--foo.bam {
                  }
                </style>
              `,
            },
            {
              output: html`
                <template>
                  <div
                    :class="\`
                      app--foo bar \${any} baz __
                      \${any} bam __
                    \`"
                  ></div>
                </template>
                <style>
                  .app--foo,
                  .app--foo.bam {
                  }
                </style>
              `,
            },
          ],
        },
      ],
    },
    {
      name: "undefined with option: ignoreClassNames as string or regexp",
      filename: "app.vue",
      options: [{ ignoreClassNames: ["bar", "/^foo/"] }],
      code: html`
        <template>
          <div class="app--foo bar foobar barbaz"></div>
        </template>
        <style>
          .app--foo,
          .app--foo.baz {
          }
        </style>
      `,
      errors: [
        {
          messageId: "undefined-modifier",
          data: { className: "barbaz" },
          line: 3,
          column: 33,
          endLine: 3,
          endColumn: 39,
          suggestions: [
            {
              output: html`
                <template>
                  <div class="app--foo bar foobar "></div>
                </template>
                <style>
                  .app--foo,
                  .app--foo.baz {
                  }
                </style>
              `,
            },
            {
              output: html`
                <template>
                  <div class="app--foo bar foobar baz"></div>
                </template>
                <style>
                  .app--foo,
                  .app--foo.baz {
                  }
                </style>
              `,
            },
          ],
        },
      ],
    },
    {
      name: "correct order for suggestions",
      filename: "app.vue",
      code: html`
        <template>
          <div class="app--foobar"></div>
          <div class="app--foo barbaz"></div>
        </template>
        <style>
          .app--foo,
          .app--foo.bar,
          .app--foo.bam,
          .app--baz {
          }
        </style>
      `,
      errors: [
        {
          messageId: "undefined-element",
          data: { className: "app--foobar" },
          line: 3,
          column: 13,
          endLine: 3,
          endColumn: 24,
          suggestions: [
            {
              output: html`
                <template>
                  <div class=""></div>
                  <div class="app--foo barbaz"></div>
                </template>
                <style>
                  .app--foo,
                  .app--foo.bar,
                  .app--foo.bam,
                  .app--baz {
                  }
                </style>
              `,
            },
            {
              output: html`
                <template>
                  <div class="app--foo"></div>
                  <div class="app--foo barbaz"></div>
                </template>
                <style>
                  .app--foo,
                  .app--foo.bar,
                  .app--foo.bam,
                  .app--baz {
                  }
                </style>
              `,
            },
            {
              output: html`
                <template>
                  <div class="app--baz"></div>
                  <div class="app--foo barbaz"></div>
                </template>
                <style>
                  .app--foo,
                  .app--foo.bar,
                  .app--foo.bam,
                  .app--baz {
                  }
                </style>
              `,
            },
          ],
        },
        {
          messageId: "undefined-modifier",
          data: { className: "barbaz" },
          line: 4,
          column: 22,
          endLine: 4,
          endColumn: 28,
          suggestions: [
            {
              output: html`
                <template>
                  <div class="app--foobar"></div>
                  <div class="app--foo "></div>
                </template>
                <style>
                  .app--foo,
                  .app--foo.bar,
                  .app--foo.bam,
                  .app--baz {
                  }
                </style>
              `,
            },
            {
              output: html`
                <template>
                  <div class="app--foobar"></div>
                  <div class="app--foo bar"></div>
                </template>
                <style>
                  .app--foo,
                  .app--foo.bar,
                  .app--foo.bam,
                  .app--baz {
                  }
                </style>
              `,
            },
            {
              output: html`
                <template>
                  <div class="app--foobar"></div>
                  <div class="app--foo bam"></div>
                </template>
                <style>
                  .app--foo,
                  .app--foo.bar,
                  .app--foo.bam,
                  .app--baz {
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
