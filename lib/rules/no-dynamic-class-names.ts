import { isString } from "lodash";
import type { VAttribute, VDirective } from "vue-eslint-parser/ast";
import type { AST } from "vue-eslint-parser";
import type {
  ArrayExpression,
  ConditionalExpression,
  ObjectExpression,
  SpreadElement,
  Expression,
} from "eslint-plugin-vue/util-types/ast";

import * as utils from "../utils/vue";
import { getClassAttrNameRegexp } from "../utils/class-attr";
import type { RuleContext, RuleListener } from "../types";

function withProps(
  context: RuleContext,
  bodyVisitor: (propNames: string[]) => RuleListener,
): RuleListener {
  const allowProps = context.options[0]?.allowProps || false;

  const propNames: string[] = ["class"];

  if (allowProps === false) {
    return bodyVisitor(propNames);
  }

  return utils.compositingVisitors(
    utils.defineScriptSetupVisitor(context, {
      onDefinePropsEnter(_, props) {
        propNames.push(...props.map((p) => p.propName).filter(isString));
      },
    }) as RuleListener,
    utils.defineVueVisitor(context, {
      onVueObjectEnter(node) {
        const props = utils.getComponentPropsFromOptions(node);
        propNames.push(...props.map((p) => p.propName).filter(isString));
      },
    }),
    bodyVisitor(propNames),
  );
}

export = {
  meta: {
    docs: {
      description: "disallow dynamic class names usage",
      default: "error",
      url: "https://github.com/levchak0910/eslint-plugin-vue-kebab-class-naming/blob/main/docs/rules/no-dynamic-class-names.md",
    },
    fixable: null,
    messages: {
      dynamic: "No dynamic class.",
    },
    schema: [
      {
        type: "object",
        properties: {
          allowConditional: {
            type: "boolean",
          },
          allowProps: {
            type: "boolean",
          },
        },
        additionalProperties: false,
      },
    ],
    type: "problem",
  },
  create(context: RuleContext): RuleListener {
    if (!context.parserServices.defineTemplateBodyVisitor) return {};

    const classAttrRegexp = getClassAttrNameRegexp(context);
    const allowConditional = context.options[0]?.allowConditional || false;

    function report(node: AST.HasLocation) {
      context.report({
        node,
        loc: node.loc,
        messageId: "dynamic",
      });
    }

    function reportDynamicInSpread(
      spread: SpreadElement,
      allowedProps: string[],
    ) {
      if (spread.argument.type === "ArrayExpression") {
        return reportDynamicInArray(spread.argument, allowedProps);
      }

      if (spread.argument.type === "ObjectExpression") {
        return reportDynamicInObject(spread.argument, allowedProps);
      }

      return report(spread.argument);
    }

    function reportDynamicInObject(
      object: ObjectExpression,
      allowedProps: string[],
    ) {
      for (const property of object.properties) {
        if (property.type === "SpreadElement") {
          reportDynamicInSpread(property, allowedProps);
          continue;
        }

        if (property.shorthand) {
          continue;
        }

        if (property.computed || property.method) {
          report(property);
          continue;
        }

        if (property.key.type === "Identifier" && isString(property.key.name)) {
          continue;
        }

        if (utils.isStringLiteral(property.key)) {
          continue;
        }

        if (property.value.type === "Identifier") {
          continue;
        }

        reportDynamicInExpression(property.value, allowedProps);
      }
    }

    function reportDynamicInArray(
      array: ArrayExpression,
      allowedProps: string[],
    ) {
      for (const element of array.elements) {
        if (element === null) continue;

        if (element.type === "SpreadElement") {
          reportDynamicInSpread(element, allowedProps);
          continue;
        }

        reportDynamicInExpression(element, allowedProps);
      }
    }

    function reportDynamicInConditional(
      conditional: ConditionalExpression,
      allowedProps: string[],
    ) {
      reportDynamicInExpression(conditional.alternate, allowedProps);
      reportDynamicInExpression(conditional.consequent, allowedProps);
    }

    function reportDynamicInExpression(
      expression: Expression,
      allowedProps: string[],
    ): void | RuleListener {
      if (expression === null) return;

      if (
        expression.type === "Literal" &&
        typeof expression.value === "string"
      ) {
        return;
      }

      if (
        expression.type === "Identifier" &&
        allowedProps.includes(expression.name)
      ) {
        return;
      }

      if (
        expression.type === "MemberExpression" &&
        expression.object.type === "Identifier" &&
        ["$props", "$attrs"].includes(expression.object.name) &&
        expression.property.type === "Identifier" &&
        allowedProps.includes(expression.property.name)
      ) {
        return;
      }

      if (expression.type === "ObjectExpression") {
        reportDynamicInObject(expression, allowedProps);
        return;
      }

      if (expression.type === "ArrayExpression") {
        reportDynamicInArray(expression, allowedProps);
        return;
      }

      if (expression.type === "ConditionalExpression" && allowConditional) {
        reportDynamicInConditional(expression, allowedProps);
        return;
      }

      report(expression);
    }

    function reportDynamic(
      attribute: VAttribute | VDirective,
      allowedProps: string[],
    ) {
      if (attribute.value === null) {
        return;
      }

      if (attribute.value.type === "VLiteral") {
        return;
      }

      if (attribute.value.expression === null) {
        return;
      }

      reportDynamicInExpression(
        attribute.value.expression as Expression,
        allowedProps,
      );
    }

    return withProps(context, (props) =>
      context.parserServices.defineTemplateBodyVisitor({
        [`VAttribute[key.name=${classAttrRegexp}]`](node: VAttribute) {
          reportDynamic(node, props);
        },
        [`VAttribute[key.argument.name=${classAttrRegexp}]`](node: VAttribute) {
          reportDynamic(node, props);
        },
      }),
    );
  },
};
