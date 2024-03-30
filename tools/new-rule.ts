import path from "path";
import fs from "fs";
import cp from "child_process";

const logger = console;

// main
((ruleId) => {
  if (ruleId == null) {
    logger.error("Usage: npm run new <RuleID>");
    process.exitCode = 1;
    return;
  }
  if (!/^[\w-]+$/u.test(ruleId)) {
    logger.error("Invalid RuleID '%s'.", ruleId);
    process.exitCode = 1;
    return;
  }

  const ruleFile = path.resolve(__dirname, `../lib/rules/${ruleId}.ts`);
  const testFile = path.resolve(__dirname, `../tests/lib/rules/${ruleId}.ts`);
  const docFile = path.resolve(__dirname, `../docs/rules/${ruleId}.md`);

  fs.writeFileSync(
    ruleFile,
    `
import {
    getStyleContexts,
    getCommentDirectivesReporter,
    isValidStyleContext,
} from "../styles/context"
import type { VCSSSelectorNode } from "../styles/ast"
import type { RuleContext, RuleListener } from "../types"

export = {
    meta: {
        docs: {
            description: "",
            categories: [''],
            default: "error",
            url: "",
        },
        fixable: null,
        schema: [],
        messages: {
        },
        type: "problem", // "suggestion",
    },
    create(context: RuleContext): RuleListener {
        const styles = getStyleContexts(context).filter(isValidStyleContext)
        if (styles.length === 0) return {}

        const reporter = getCommentDirectivesReporter(context)

        function report(node: VCSSSelectorNode) {
            reporter.report({
                node,
                loc: node.loc,
                messageId: "???",
                data: {},
            })
        }


        return {
            "<token>"(node) {
                return report(node)
            },
        }
    },
}
`,
  );
  fs.writeFileSync(
    testFile,
    `import { RuleTester } from "../test-lib/eslint-compat"
import rule = require("../../../lib/rules/${ruleId}")
import * as vueParser from "vue-eslint-parser";

const tester = new RuleTester({
  languageOptions: {
    parser: vueParser,
    ecmaVersion: 2019,
    sourceType: "module",
  },
})

tester.run("${ruleId}", rule as any, {
    valid: [
        \`
        <template>
            <div class="foo"></div>
        </template>
        <style>
            .foo {}
        </style>
        \`
    ],
    invalid: [
        {
            code: \`
            <template>
                <div class="foo"></div>
            </template>
            <style>
                .bar {}
            </style>
            \`,
            errors: [
                {
                    messageId: "???",
                    data: {},
                    line: 1,
                    column: 1,
                    endLine: 1,
                    endColumn: 1,
                },
            ],
        },
    ],
})
`,
  );
  fs.writeFileSync(
    docFile,
    `# vue-kebab-class-naming/${ruleId}

> <short description>

## :book: Rule Details

<full description>

## :wrench: Options

\`\`\`json
{
  "vue-kebab-class-naming/${ruleId}": ["error", {
   
  }]
}
\`\`\`

- 

## :books: Further reading

- Fill or delete section

`,
  );

  try {
    const files = [ruleFile, testFile].map((p) =>
      path.relative(path.resolve("."), p),
    );

    cp.execSync(`npx eslint --fix ${files.join(" ")}`);
  } catch {
    //
  }
})(process.argv[2]);
