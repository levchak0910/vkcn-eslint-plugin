import type { ESLintNode, VNode } from "vue-eslint-parser/ast";
import type { RuleContext } from "../types";
import { isRegExp, toRegExp } from "./regexp";
import { getSourceCode } from "./compat";

/**
 * Checks whether the given context has template block
 */
export function hasTemplateBlock(context: RuleContext): boolean {
  const sourceCode = getSourceCode(context);
  const { ast } = sourceCode;
  return Boolean(ast.templateBody);
}

/**
 * Checks whether the given node has defined
 */
export function isDefined<T>(item: T | null | undefined): item is T {
  return item !== null && item !== undefined;
}

export function isSatisfyList(list: string[], item: string): boolean {
  let itemSatisfies = list.includes(item);

  if (itemSatisfies) return true;

  const regexpItems = list.filter(isRegExp).map((reg) => toRegExp(reg));

  for (const regexp of regexpItems) {
    if (regexp.test(item)) {
      itemSatisfies = true;
      break;
    }
  }

  return itemSatisfies;
}

export function getParentByType<T extends VNode["type"] | ESLintNode["type"]>(
  node: VNode | ESLintNode,
  type: T,
): T extends VNode["type"]
  ? Extract<VNode, { type: T }>
  : Extract<ESLintNode, { type: T }> {
  if (node === null) throw new Error("node SHOULD BE PROVIDED");

  let parent = node.parent;
  while (parent && parent?.type !== type) {
    parent = parent.parent;
  }

  if (!parent) throw new Error("parent SHOULD BE AVAILABLE");

  // @ts-expect-error -- it is fine
  return parent;
}
