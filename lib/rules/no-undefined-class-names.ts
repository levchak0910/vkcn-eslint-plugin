import type {
  VAttribute,
  VDirective,
  VStartTag,
  ESLintStringLiteral,
  ESLintProperty,
  ESLintTemplateLiteral,
} from "vue-eslint-parser/ast";
import type { SourceLocation, Position, Node } from "estree";
import { isObject, isString } from "lodash";
import { distance } from "fastest-levenshtein";
import { query } from "esquery";

import { getResolvedSelectors } from "../styles/selectors";
import type { VCSSSelectorNode } from "../styles/ast";
import { isClassSelector } from "../styles/utils/selectors";
import type { RuleContext, RuleListener, RuleFixer } from "../types";
import { type ValidStyleContext, isValidStyleContext } from "../styles/context";
import {
  getStyleContexts,
  getCommentDirectivesReporter,
} from "../styles/context";
import {
  getParentByType,
  hasTemplateBlock,
  isDefined,
  isSatisfyList,
} from "../utils/utils";
import { getClassAttrNameRegexp, getAttrName } from "../utils/class-attr";

function getAllSelectorsFromStyles(
  styles: ValidStyleContext[],
): VCSSSelectorNode[][] {
  return styles.flatMap((style) => {
    const resolvedSelectors = getResolvedSelectors(style);
    return resolvedSelectors
      .map((resolvedSelector) => resolvedSelector.selector)
      .filter(isDefined);
  });
}

function getVKCNClasses(
  selectorGroups: VCSSSelectorNode[][],
): Map<string, Set<string>> {
  const map = new Map<string, Set<string>>();

  selectorGroups.forEach((selectorGroup) => {
    const classSelectors = selectorGroup.filter(isClassSelector);
    const elementSelector = classSelectors[0].value;

    if (!map.has(elementSelector)) {
      map.set(elementSelector, new Set());
    }

    if (classSelectors.length <= 1) return;

    classSelectors.slice(1).forEach((selector) => {
      const modifierClasses = map.get(elementSelector)!;
      modifierClasses.add(selector.value);
    });
  });

  return map;
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

function getClassesFromClassString(classString: string): string[] {
  return classString
    .split(" ")
    .flatMap((line) => line.split("\r"))
    .flatMap((line) => line.split("\n"))
    .filter(Boolean);
}

function getAllClassesFromExpression(expression: Node): string[] {
  const literals = query(
    expression,
    "Literal:not(ConditionalExpression .test Literal):not(Property .value Literal)",
  );
  const properties = query(expression, "Property");
  const templateElements = query(expression, "TemplateElement");

  const classesFromLiterals = literals.flatMap((literal) => {
    if (literal.type !== "Literal") return [];
    return getClassesFromClassString(
      typeof literal.value === "string" ? literal.value : "",
    );
  });

  const classesFromProperties = properties.flatMap((property) => {
    if (property.type !== "Property") return [];

    return getClassesFromClassString(
      property.key.type === "Identifier" ? property.key.name : "",
    );
  });

  const classesFromTemplateElements = templateElements.flatMap(
    (templateElement) => {
      if (templateElement.type !== "TemplateElement") return [];

      return getClassesFromClassString(templateElement.value.raw);
    },
  );

  return [
    ...classesFromLiterals,
    ...classesFromProperties,
    ...classesFromTemplateElements,
  ];
}

type ClassesFromTag = {
  valid: 0 | 1 | 2;
  element: string;
  modifiers: string[];
};

function getAllClassesFromTag(
  tag: VStartTag,
  classAttrName: string,
): ClassesFromTag {
  const tagClasses: string[] = [];

  tag.attributes.forEach((attr) => {
    if (
      attr.key.type === "VIdentifier" &&
      attr.key.name === classAttrName &&
      attr.value?.type === "VLiteral"
    ) {
      const classes = getClassesFromClassString(attr.value.value);
      tagClasses.push(...classes);
    }

    if (
      attr.key.type === "VDirectiveKey" &&
      attr.key.argument?.type === "VIdentifier" &&
      attr.key.name.name === "bind" &&
      attr.key.argument.name === classAttrName &&
      attr.value?.type === "VExpressionContainer"
    ) {
      const classes = getAllClassesFromExpression(
        attr.value.expression as Node,
      );
      tagClasses.push(...classes);
    }
  });

  const elements = tagClasses.filter((c) => c.includes("--"));
  const modifiers = tagClasses.filter((c) => !c.includes("--"));

  const valid = elements.length === 0 ? 0 : elements.length === 1 ? 1 : 2;
  const element = elements[0];

  return { valid, element, modifiers };
}

export = {
  meta: {
    docs: {
      description:
        "disallow class names being used in `<template>` that are not defined in `<style>`",
      default: "error",
      url: "https://github.com/levchak0910/eslint-plugin-vue-kebab-class-naming/blob/main/docs/rules/no-undefined-class-names.md",
    },
    fixable: null,
    messages: {
      "undefined-element": "The element class name is undefined.",
      "excess-element":
        "The element class name can not be defined twice ot more.",
      "undefined-modifier":
        "The modifier class name `{{className}}` is undefined.",
      useDefined: "Use '{{className}}' instead.",
      removeUndefined: "Remove class name '{{className}}' from template.",
    },
    schema: [
      {
        type: "object",
        properties: {
          ignoreClassNames: {
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
    const classAttrRegexpAsString = classAttrRegexp.toString();

    const ignoreClassNames =
      (context.options[0]?.ignoreClassNames as string[]) ?? [];

    const selectorGroups = getAllSelectorsFromStyles(styles);
    const vkcnClassSelectors = getVKCNClasses(selectorGroups);

    function reportClass({
      className,
      classType,
      elementClass,
      kind,
      transform,
      location,
      line,
      startCol,
      endCol,
    }: {
      className: string;
      classType: "element" | "modifier";
      elementClass: string;
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

      const allAvailableClasses = className.includes("--")
        ? Array.from(vkcnClassSelectors.keys())
        : Array.from(vkcnClassSelectors.get(elementClass)?.values() ?? []);

      reporter.report({
        loc: { start, end },
        messageId: `undefined-${classType}`,
        data: { className },
        suggest: [
          {
            messageId: "removeUndefined",
            data: { className },
            fix(fixer) {
              return fixer.removeRange([startIndex, endIndex]);
            },
          },
          ...allAvailableClasses
            .map((availableClassName) => {
              let adaptedClassName = availableClassName;

              if (kind === "quoted")
                adaptedClassName = `'${availableClassName}'`;

              if (kind === "quotable" && availableClassName.includes("-"))
                adaptedClassName = `'${availableClassName}'`;

              return {
                className: availableClassName,
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

    function handleClassList(
      classListString: string,
      elementClass: string,
      report: (
        notFoundClassName: string,
        classType: "element" | "modifier",
      ) => void,
    ): void {
      const classes = classListString
        .trim()
        .split(" ")
        .map((c) => c.trim())
        .filter((c) => c.length > 0)
        .filter((c) => !isSatisfyList(ignoreClassNames, c));

      classes.forEach((className) => {
        if (className === elementClass && !vkcnClassSelectors.has(className)) {
          report(className, "element");
        }

        if (className !== elementClass) {
          const modifierClasses = vkcnClassSelectors.get(elementClass);

          if (!modifierClasses || !modifierClasses.has(className)) {
            report(className, "modifier");
          }
        }
      });
    }

    function reportInvalidAttr(
      attr: VAttribute | VDirective,
      attrClasses: ClassesFromTag,
    ): boolean {
      if (attrClasses.valid !== 1) {
        reporter.report({
          node: attr,
          messageId:
            attrClasses.valid === 0 ? "undefined-element" : "excess-element",
        });
        return true;
      }

      return false;
    }

    return context.parserServices.defineTemplateBodyVisitor({
      [`VAttribute[key.name=${classAttrRegexpAsString}]`](attr: VAttribute) {
        const classListString = attr.value?.value;
        if (classListString === undefined) return;

        const tag = getParentByType(attr, "VStartTag");
        const attrClasses = getAllClassesFromTag(tag, attr.key.name);

        if (reportInvalidAttr(attr, attrClasses)) return;

        handleClassList(
          classListString,
          attrClasses.element,
          (className, classType) => {
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
              classType,
              elementClass: attrClasses.element,
              kind: "plain",
              line: reportLine,
              startCol: reportStartColumn,
              endCol: reportEndColumn,
            });
          },
        );
      },
      [`VAttribute[key.argument.name=${classAttrRegexpAsString}] VExpressionContainer Literal:not(ConditionalExpression .test Literal):not(Property .value Literal)`](
        literal: ESLintStringLiteral,
      ) {
        if (!isString(literal.value)) return;

        const attr = getParentByType(literal, "VAttribute");
        const tag = getParentByType(attr, "VStartTag");
        const attrName = getAttrName(attr);
        const attrClasses = getAllClassesFromTag(tag, attrName);

        if (reportInvalidAttr(attr, attrClasses)) return;

        const literalLoc = literal.loc;
        const classListString = isString(literal.value) ? literal.value : "";
        const isClassListSingle = classListString.split(" ").length <= 1;

        if (isClassListSingle) {
          handleClassList(
            classListString,
            attrClasses.element,
            (className, classType) => {
              reportClass({
                className,
                classType,
                elementClass: attrClasses.element,
                kind: "quoted",
                location: literalLoc,
              });
            },
          );
          return;
        }

        handleClassList(
          classListString,
          attrClasses.element,
          (className, classType) => {
            const { startColumn } = getClassPosition(
              classListString,
              className,
            );

            const reportStartColumn = literalLoc.start.column + startColumn + 1;
            const reportEndColumn = reportStartColumn + className.length;

            reportClass({
              className,
              classType,
              elementClass: attrClasses.element,
              kind: "plain",
              line: literalLoc.start.line,
              startCol: reportStartColumn,
              endCol: reportEndColumn,
            });
          },
        );
      },
      [`VAttribute[key.argument.name=${classAttrRegexpAsString}] VExpressionContainer TemplateLiteral`](
        templateLiteral: ESLintTemplateLiteral,
      ) {
        const attr = getParentByType(templateLiteral, "VAttribute");
        const tag = getParentByType(attr, "VStartTag");
        const attrName = getAttrName(attr);
        const attrClasses = getAllClassesFromTag(tag, attrName);

        if (reportInvalidAttr(attr, attrClasses)) return;

        const elementClass = attrClasses.element;

        templateLiteral.quasis.forEach(
          (templateElement, templateElementIndex) => {
            const classListString = templateElement.value.raw;
            const templateElementLoc = templateElement.loc;

            handleClassList(
              classListString,
              elementClass,
              (className, classType) => {
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
                    classType,
                    elementClass,
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
                  classType,
                  elementClass,
                  kind: "plain",
                  line: reportLine,
                  startCol: reportStartColumn,
                  endCol: reportEndColumn,
                });
              },
            );
          },
        );
      },
      [`VAttribute[key.argument.name=${classAttrRegexpAsString}] VExpressionContainer Property`](
        property: ESLintProperty,
      ) {
        if (property.key.type !== "Identifier") return;

        const attr = getParentByType(property, "VAttribute");
        const tag = getParentByType(attr, "VStartTag");
        const attrName = getAttrName(attr);
        const attrClasses = getAllClassesFromTag(tag, attrName);

        if (reportInvalidAttr(attr, attrClasses)) return;

        handleClassList(
          property.key.name,
          attrClasses.element,
          (className, classType) => {
            reportClass({
              className,
              classType,
              elementClass: attrClasses.element,
              kind: "quotable",
              transform: (adaptedClassName, oldClassName) =>
                property.shorthand
                  ? `${adaptedClassName}: ${oldClassName}`
                  : adaptedClassName,
              location: property.key.loc,
            });
          },
        );
      },
    });
  },
};
