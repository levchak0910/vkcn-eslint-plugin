import type { HasLocation } from "./locations";
import type * as VAST from "../ast";

export interface BaseNode extends HasLocation {
  type: string;
  parent: VAST.ASTNode | null;
}

export interface HasParentNode extends BaseNode {
  parent: VAST.ASTNode;
}
