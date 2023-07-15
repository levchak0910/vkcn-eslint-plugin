import type { VAttribute } from "vue-eslint-parser/ast";
import type { Literal, Property, TemplateLiteral } from "estree";
import type { SourceLocation, Position } from "estree";
import { isObject, isString } from "lodash";
import { distance } from "fastest-levenshtein";

import { getResolvedSelectors } from "../styles/selectors";
import type { VCSSSelectorNode } from "../styles/ast";
import { isClassSelector } from "../styles/utils/selectors";
import type { RuleContext, RuleListener, RuleFixer } from "../types";
import { type ValidStyleContext, isValidStyleContext } from "../styles/context";
import {
  getStyleContexts,
  getCommentDirectivesReporter,
} from "../styles/context";
import { hasTemplateBlock, isDefined } from "../utils/utils";
import { toRegExp } from "../utils/regexp";
import { getClassAttrNameRegexp } from "../utils/class-attr";

function getSelectors(style: ValidStyleContext): VCSSSelectorNode[] {
  const resolvedSelectors = getResolvedSelectors(style);
  return resolvedSelectors
    .map((resolvedSelector) => resolvedSelector.selector)
    .filter(isDefined)
    .flat();
}

function getClassPositionInSingleLine(
  classListString: string,
  className: string,
): number {
  let found = false;
  return classListString.split(" ").reduce((pos, cName) => {
    if (found) {
      return pos;
    }

    if (cName === className) {
      found = true;
      return pos;
    }

    return pos + cName.length + 1;
  }, 0);
}

/** Get class position in single or multiline string */
function getClassPosition(
  classListString: string,
  className: string,
): {
  isMultiline: boolean;
  line: number;
  startColumn: number;
} {
  const lines = classListString.split("\n");

  const isMultiline = lines.length > 1;
  let line = -1;
  let startColumn = -1;

  if (isMultiline) {
    const classLineIndex = lines.findIndex((l) => l.includes(className))!;
    const classLine = lines[classLineIndex];

    line = classLineIndex;
    startColumn = getClassPositionInSingleLine(classLine, className);
  } else {
    line = 0;
    startColumn = getClassPositionInSingleLine(classListString, className);
  }

  return { isMultiline, line, startColumn };
}

export = {
  meta: {
    docs: {
      description:
        "disallow class names being used in `<template>` that are not defined in `<style>`",
      categories: [],
      default: "error",
      url: "https://github.com/levchak0910/eslint-plugin-vue-kebab-class-naming/blob/main/docs/rules/no-undefined-class-names.md",
    },
    fixable: null,
    messages: {
      undefined: "The class name `{{className}}` is undefined.",
      useDefined: "Use '{{className}}' instead.",
      removeUndefined: "Remove class name '{{className}}' from template.",
    },
    schema: [
      {
        type: "object",
        properties: {
          ignoreClassNameList: {
            type: "array",
            items: { type: "string" },
            uniqueItems: true,
            additionalItems: true,
          },
          ignoreClassNameRegexps: {
            type: "array",
            items: { type: "string" },
            uniqueItems: true,
            additionalItems: true,
          },
        },
        additionalProperties: false,
      },
    ],
    type: "suggestion",
    hasSuggestions: true,
  },
  create(context: RuleContext): RuleListener {
    if (!hasTemplateBlock(context)) {
      return {};
    }
    const styles = getStyleContexts(context).filter(isValidStyleContext);
    const source = context.getSourceCode();
    const reporter = getCommentDirectivesReporter(context);

    const classAttrRegexp = getClassAttrNameRegexp(context);

    const classSelectors = styles
      .map(getSelectors)
      .flat()
      .filter(isClassSelector);

    function reportClass({
      className,
      kind,
      transform,
      location,
      line,
      startCol,
      endCol,
    }: {
      className: string;
      kind: "plain" | "quotable" | "quoted";
      transform?: (adaptedClassName: string, oldClassName?: string) => string;
      location?: SourceLocation;
      line?: number;
      startCol?: number;
      endCol?: number;
    }) {
      const start: Position = isObject(location)
        ? location.start
        : {
            line: line!,
            column: startCol!,
          };

      const end: Position = isObject(location)
        ? location.end
        : {
            line: line!,
            column: endCol!,
          };

      const startIndex = source.getIndexFromLoc(start);
      const endIndex = source.getIndexFromLoc(end);

      reporter.report({
        loc: { start, end },
        messageId: "undefined",
        data: { className },
        suggest: [
          {
            messageId: "removeUndefined",
            data: { className },
            fix(fixer) {
              return fixer.removeRange([startIndex, endIndex]);
            },
          },
          ...classSelectors
            .map((classSelector) => {
              let adaptedClassName = classSelector.value;

              if (kind === "quoted")
                adaptedClassName = `'${classSelector.value}'`;

              if (kind === "quotable" && classSelector.value.includes("-"))
                adaptedClassName = `'${classSelector.value}'`;

              return {
                className: classSelector.value,
                adaptedClassName,
              };
            })
            .reduce<
              {
                className: string;
                adaptedClassName: string;
              }[]
            >((acc, classData) => {
              const exist = acc.find(
                (i) => i.className === classData.className,
              );

              if (exist === undefined) {
                acc.push(classData);
              }

              return acc;
            }, [])
            .sort((c1, c2) => {
              if (
                c1.className.includes(className) ||
                className.includes(c1.className)
              ) {
                return -1;
              }

              if (
                c2.className.includes(className) ||
                className.includes(c2.className)
              ) {
                return 1;
              }

              const d1 = distance(className, c1.className);
              const d2 = distance(className, c2.className);
              return d1 - d2;
            })
            .slice(0, 7)
            .map((data) => ({
              messageId: "useDefined",
              data: { className: data.className },
              fix: (fixer: RuleFixer) =>
                fixer.replaceTextRange(
                  [startIndex, endIndex],
                  transform
                    ? transform(data.adaptedClassName, className)
                    : data.adaptedClassName,
                ),
            })),
        ],
      });
    }

    const ignoreClassNameList =
      (context.options[0]?.ignoreClassNameList as string[]) ?? [];
    const ignoreClassNameRegexps = (
      (context.options[0]?.ignoreClassNameRegexps as string[]) ?? []
    ).map((regExpString) => toRegExp(regExpString));

    function handleClass(
      classListString: string,
      report: (notFoundClassName: string) => void,
    ): void {
      const classes = classListString
        .trim()
        .split(" ")
        .map((c) => c.trim())
        .filter((c) => c.length > 0);

      classes.forEach((className) => {
        if (ignoreClassNameList.includes(className)) return;
        if (ignoreClassNameRegexps.some((r) => r.test(className))) return;

        const foundSelector = classSelectors.find((s) => s.value === className);

        if (foundSelector === undefined) {
          report(className);
        }
      });
    }

    return context.parserServices.defineTemplateBodyVisitor({
      [`VAttribute[key.name=${classAttrRegexp}]`](attr: VAttribute) {
        const classListString = attr.value?.value;
        if (classListString === undefined) return;

        handleClass(classListString, (className) => {
          const { isMultiline, line, startColumn } = getClassPosition(
            classListString,
            className,
          );

          const reportLine = attr.loc.start.line + line;
          const reportStartColumn = isMultiline
            ? startColumn
            : attr.loc.start.column + startColumn + attr.key.name.length + 2;
          const reportEndColumn = reportStartColumn + className.length;

          reportClass({
            className,
            kind: "plain",
            line: reportLine,
            startCol: reportStartColumn,
            endCol: reportEndColumn,
          });
        });
      },
      [`VAttribute[key.argument.name=${classAttrRegexp}] VExpressionContainer Literal:not(ConditionalExpression .test Literal):not(Property .value Literal)`](
        literal: Literal,
      ) {
        if (!isString(literal.value)) return;

        const literalLoc = literal.loc!;
        const classListString = isString(literal.value) ? literal.value : "";
        const isClassListSingle = classListString.split(" ").length <= 1;

        if (isClassListSingle) {
          handleClass(classListString, (className) => {
            reportClass({
              className,
              kind: "quoted",
              location: literalLoc,
            });
          });
          return;
        }

        handleClass(classListString, (className) => {
          const { startColumn } = getClassPosition(classListString, className);

          const reportStartColumn = literalLoc.start.column + startColumn + 1;
          const reportEndColumn = reportStartColumn + className.length;

          reportClass({
            className,
            kind: "quoted",
            line: literalLoc.start.line,
            startCol: reportStartColumn,
            endCol: reportEndColumn,
          });
        });
      },
      [`VAttribute[key.argument.name=${classAttrRegexp}] VExpressionContainer TemplateLiteral`](
        templateLiteral: TemplateLiteral,
      ) {
        templateLiteral.quasis.forEach(
          (templateElement, templateElementIndex) => {
            const classListString = templateElement.value.raw;
            const templateElementLoc = templateElement.loc!;

            handleClass(classListString, (className) => {
              const { isMultiline, line, startColumn } = getClassPosition(
                classListString,
                className,
              );

              if (!isMultiline) {
                const reportLine = templateElementLoc.start.line + line;
                const reportStartColumn =
                  templateElementLoc.start.column + startColumn + 1;
                const reportEndColumn = reportStartColumn + className.length;

                reportClass({
                  className,
                  kind: "plain",
                  line: reportLine,
                  startCol: reportStartColumn,
                  endCol: reportEndColumn,
                });

                return;
              }

              const prevTemplateElement =
                templateLiteral.quasis[templateElementIndex - 1];
              const prevTemplateElementLoc = prevTemplateElement?.loc;

              const isOnTheSameLineWithPreviousSinglelineElement =
                prevTemplateElementLoc?.start.line ===
                templateElementLoc.start.line;

              const isOnTheSameLineWithPreviousMultilineElement =
                prevTemplateElement?.value.raw.includes("\n") &&
                (prevTemplateElementLoc?.start.line ?? NaN) + 1 ===
                  templateElementLoc.start.line;

              const isAfterPreviousElement =
                (prevTemplateElementLoc?.start.column ?? NaN) <
                templateElementLoc.start.column;

              const isOnTheSameLineWithPreviousElement =
                isOnTheSameLineWithPreviousMultilineElement ||
                (isOnTheSameLineWithPreviousSinglelineElement &&
                  isAfterPreviousElement);

              const reportLine = templateElementLoc.start.line + line;
              const reportStartColumn =
                isOnTheSameLineWithPreviousElement && line === 0
                  ? templateElementLoc.start.column + startColumn + 1
                  : startColumn;
              const reportEndColumn = reportStartColumn + className.length;

              reportClass({
                className,
                kind: "plain",
                line: reportLine,
                startCol: reportStartColumn,
                endCol: reportEndColumn,
              });
            });
          },
        );
      },
      [`VAttribute[key.argument.name=${classAttrRegexp}] VExpressionContainer Property`](
        property: Property,
      ) {
        if (property.key.type !== "Identifier") return;

        handleClass(property.key.name, (className) => {
          reportClass({
            className,
            kind: "quotable",
            transform: (adaptedClassName, oldClassName) =>
              property.shorthand
                ? `${adaptedClassName}: ${oldClassName}`
                : adaptedClassName,
            location: property.key.loc!,
          });
        });
      },
    });
  },
};
