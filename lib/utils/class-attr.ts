import type { RuleContext } from "../types";
import type { VAttribute, VDirective } from "vue-eslint-parser/ast";

export function getClassAttrNameRegexp(context: RuleContext): RegExp {
  const customClassAttrName = context.settings?.["vkcn/class-attr-name"];

  const customClassAttrNameRegexp =
    customClassAttrName instanceof RegExp ? customClassAttrName : /^class$/;

  return customClassAttrNameRegexp;
}

export function getAttrName(attr: VAttribute | VDirective): string {
  if (attr.key.type === "VIdentifier") return attr.key.name;

  if (attr.key.argument?.type === "VIdentifier") return attr.key.argument.name;

  throw new Error("UNINTENDED ACCESS TO ATTRIBUTE WITH STATIC NAME");
}
