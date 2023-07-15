import type { RuleContext } from "../types";

export function getClassAttrNameRegexp(context: RuleContext): string {
  const customClassAttrName = context.settings?.["vkcn/class-attr-name"];

  const customClassAttrNameRegexp =
    customClassAttrName instanceof RegExp ? customClassAttrName : /^class$/;

  return customClassAttrNameRegexp.toString();
}
