import { kebabCase } from "case-anything";
import path from "path";
import {
  getStyleContexts,
  getCommentDirectivesReporter,
  isValidStyleContext,
} from "../styles/context";
import type {
  VCSSSelectorNode,
  VCSSClassSelector,
  VCSSSelectorCombinator,
  VCSSTypeSelector,
  VCSSUniversalSelector,
  VCSSSelectorPseudo,
} from "../styles/ast";
import type {
  RuleContext,
  RuleListener,
  ReportDescriptor,
  RuleFixer,
} from "../types";
import { getResolvedSelectors } from "../styles/selectors";
import { isDefined } from "../utils/utils";
import { getFilename } from "../utils/compat";
import type { ValidStyleContext } from "../styles/context";

export = {
  meta: {
    docs: {
      description: "enforce convention",
      default: "error",
      url: "https://github.com/levchak0910/eslint-plugin-vkcn/blob/main/docs/rules/no-convention-violation.md",
    },
    fixable: "code",
    messages: {
      "class-top-naming":
        "Element class name should follow pattern `<prefix>--<element>`, where `prefix` and `element` should be named in kebab case.",
      "class-top-naming-suggestion": "Use '{{selector}}' class name.",
      "class-nested-naming":
        "Modifier class name should be named in kebab case.",
      "class-nested-previous-non-class":
        "Modifier can be applied only to element.",
      "class-nested-modifiers": "Modifiers can not be nested.",
      "combinator-type-allowed": "Only `>` combinator allowed.",
      "combinator-child-allowed": "Only type selector is allowed.",
      "combinator-only-allowed": "Only 1 combinator selector is allowed.",
      "type-only-inside":
        "Type selectors usage is allowed only inside element selector.",
      "type-nested":
        "Type selectors nesting is allowed only inside element selector.",
      "universal-invalid-parent":
        "Universal selector can be used only with combinator '>'.",
      "pseudo-child": "No selectors are allowed after pseudo.",
      "no-violation": "This selector violate convention.",
    },
    schema: [
      {
        type: "object",
        properties: {
          allowTopLevelNonClassSelector: {
            type: "boolean",
          },
          enableFix: {
            type: "boolean",
          },
        },
        additionalProperties: false,
      },
    ],
    type: "problem",
    hasSuggestions: true,
  },
  create(context: RuleContext): RuleListener {
    const styles = getStyleContexts(context).filter(isValidStyleContext);
    if (styles.length === 0) return {};

    const reporter = getCommentDirectivesReporter(context);
    const reportedMap = new Map<string, Set<VCSSSelectorNode>>();

    function report(
      node: VCSSSelectorNode,
      descriptorOrMessage: string | Partial<ReportDescriptor> = {},
    ) {
      const descriptor: Partial<ReportDescriptor & { messageId: string }> =
        typeof descriptorOrMessage === "string"
          ? { messageId: descriptorOrMessage }
          : descriptorOrMessage;

      const messageId = descriptor.messageId ?? "no-violation";

      const reportedNodes = reportedMap.get(messageId);
      if (reportedNodes?.has(node)) return;

      if (!reportedNodes) reportedMap.set(messageId, new Set([node]));
      else reportedNodes.add(node);

      reporter.report({
        node,
        loc: node.loc,
        messageId,
        data: {},
        ...descriptor,
      });
    }

    const allowTopLevelNonClassSelector =
      context.options[0]?.allowTopLevelNonClassSelector ?? false;
    const enableFix = context.options[0]?.enableFix ?? false;

    const DIVIDER = "--";
    const COMMENT = "vkcn-prefix";

    function reportTopLevelClassSelector(
      selector: VCSSClassSelector,
      prefix: string,
    ): void {
      const className = selector.value;
      const elementName = className.split(DIVIDER)[1] || className;
      const elementClassSelector = `.${prefix}${DIVIDER}${kebabCase(
        elementName,
      )}`;

      const validPrefix = className.startsWith(`${prefix}${DIVIDER}`);
      const validKebabElementName = elementName === kebabCase(elementName);
      const validStartElementName =
        selector.node.type === "class" && /^[a-z]/.test(selector.node.value);

      if (validPrefix && validKebabElementName && validStartElementName) return;

      report(selector, {
        messageId: "class-top-naming",
        fix: (fixer) => {
          if (!enableFix || !validStartElementName) return null;

          return fixer.replaceTextRange(selector.range, elementClassSelector);
        },
        suggest:
          enableFix || !validStartElementName
            ? []
            : [
                {
                  messageId: "class-top-naming-suggestion",
                  data: { selector: elementClassSelector },
                  fix: (fixer: RuleFixer) =>
                    fixer.replaceTextRange(
                      selector.range,
                      elementClassSelector,
                    ),
                },
              ],
      });
    }

    function reportNestedLevelClassSelector(
      selector: VCSSClassSelector,
      level: number,
      selectors: VCSSSelectorNode[],
    ): void {
      const ind = selectors.findIndex(
        (s, i) => i < level && s.type !== "VCSSClassSelector",
      );
      const invalidPreviousNode = ind !== -1;

      if (invalidPreviousNode) {
        report(selector, "class-nested-previous-non-class");
        return;
      }

      const isValidNesting =
        level > 1 ? selector.parent.node === selectors[1].node.parent : true;

      if (!isValidNesting) {
        report(selector, "class-nested-modifiers");
        return;
      }

      const kebabClass = kebabCase(selector.value);
      const validClass = selector.value === kebabClass;

      if (!validClass) {
        report(selector, {
          messageId: "class-nested-naming",
          fix: (fixer) => {
            if (!enableFix) return null;
            return fixer.replaceTextRange(selector.range, `.${kebabClass}`);
          },
        });
      }
    }

    function reportClassSelector({
      selector,
      level,
      prefix,
      selectors,
    }: {
      selector: VCSSClassSelector;
      level: number;
      prefix: string;
      selectors: VCSSSelectorNode[];
    }): void {
      if (level === 0) {
        reportTopLevelClassSelector(selector, prefix);
      } else {
        reportNestedLevelClassSelector(selector, level, selectors);
      }
    }

    function reportCombinatorSelector(
      selector: VCSSSelectorCombinator,
      level: number,
      selectors: VCSSSelectorNode[],
    ): void {
      const validCombinator = selector.value === ">";

      if (!validCombinator) {
        report(selector, "combinator-type-allowed");
        return;
      }

      const ind = selectors.findIndex(
        (s, i) => i < level && s.type === "VCSSSelectorCombinator",
      );
      const validOnlyCombinator = ind === -1;

      if (!validOnlyCombinator) {
        report(selector, "combinator-only-allowed");
        return;
      }

      const childSelector = selectors[level + 1];
      const validChild =
        childSelector.type === "VCSSTypeSelector" ||
        childSelector.type === "VCSSUniversalSelector";

      if (!validChild) {
        report(childSelector, "combinator-child-allowed");
      }
    }

    function reportTypeSelector(
      selector: VCSSTypeSelector,
      level: number,
    ): void {
      if (allowTopLevelNonClassSelector && level === 0) {
        return;
      }

      const validLevel = level === 2;
      if (!validLevel) {
        report(selector, "type-only-inside");
        return;
      }

      const validTagName =
        selector.node.type === "tag" && selector.node.value === selector.value;

      if (!validTagName) {
        report(selector, "type-nested");
      }
    }

    function reportUniversalSelector(
      selector: VCSSUniversalSelector,
      level: number,
      selectors: VCSSSelectorNode[],
    ): void {
      const parentSelector = selectors[level - 1];

      if (parentSelector === undefined) {
        return;
      }

      const validParent =
        parentSelector.type === "VCSSSelectorCombinator" &&
        parentSelector.value === ">";

      if (!validParent) {
        report(selector, "universal-invalid-parent");
      }
    }

    function reportPseudoSelector(
      selector: VCSSSelectorPseudo,
      level: number,
      selectors: VCSSSelectorNode[],
    ): void {
      const nextNonPseudoSelector = selectors.find(
        (s, i) => i > level && s.type !== "VCSSSelectorPseudo",
      );
      const validChildSelector = nextNonPseudoSelector === undefined;

      if (!validChildSelector) {
        report(selector, "pseudo-child");
      }
    }

    function reportSelector({
      selector,
      level,
      prefix,
      selectors,
    }: {
      selector: VCSSSelectorNode;
      level: number;
      prefix: string;
      selectors: VCSSSelectorNode[];
    }): void {
      if (selector.type === "VCSSClassSelector") {
        reportClassSelector({
          selector,
          level,
          prefix,
          selectors,
        });
        return;
      }

      if (level === 0 && !allowTopLevelNonClassSelector) {
        report(selector);
        return;
      }

      if (selector.type === "VCSSSelectorCombinator") {
        reportCombinatorSelector(selector, level, selectors);
        return;
      }

      if (selector.type === "VCSSTypeSelector") {
        reportTypeSelector(selector, level);
        return;
      }

      if (selector.type === "VCSSUniversalSelector") {
        reportUniversalSelector(selector, level, selectors);
        return;
      }

      if (selector.type === "VCSSSelectorPseudo") {
        reportPseudoSelector(selector, level, selectors);
      }
    }

    function getPrefix(style: ValidStyleContext): string {
      const fileName = getFilename(context);
      const { dir, name } = path.parse(fileName);

      const defaultComponentName =
        name === "index"
          ? kebabCase(dir.split(path.sep).at(-1)!)
          : kebabCase(name);

      const comment = style.cssNode.comments.find((c) =>
        c.text.startsWith(COMMENT),
      );

      if (!comment) return defaultComponentName;

      const [, componentName] = comment.text.split(" ");

      if (!componentName || componentName !== kebabCase(componentName))
        return defaultComponentName;

      return kebabCase(componentName);
    }

    return {
      "Program:exit"() {
        for (const style of styles) {
          const prefix = getPrefix(style);
          const resolvedSelectors =
            getResolvedSelectors(style).filter(isDefined);

          for (const resolvedSelector of resolvedSelectors) {
            resolvedSelector.selector.forEach((selector, level) =>
              reportSelector({
                selector,
                level,
                prefix,
                selectors: resolvedSelector.selector,
              }),
            );
          }
        }
      },
    };
  },
};
