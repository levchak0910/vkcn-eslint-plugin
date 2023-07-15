import type { RuleContext } from "../types";
import { isRegExp, toRegExp } from "./regexp";

/**
 * Checks whether the given context has template block
 */
export function hasTemplateBlock(context: RuleContext): boolean {
  const sourceCode = context.getSourceCode();
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
