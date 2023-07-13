import type * as VAST from "./ast";
export type VueObjectType = "mark" | "export" | "definition" | "instance";
export type VueObjectData = {
  node: VAST.ObjectExpression;
  type: VueObjectType;
  parent: VueObjectData | null;
  functional: boolean;
};
type VueVisitorBase = {
  [T in keyof VAST.NodeListenerMap]?: (
    node: VAST.NodeListenerMap[T],
    obj: VueObjectData
  ) => void;
};
export interface VueVisitor extends VueVisitorBase {
  onVueObjectEnter?(node: VAST.ObjectExpression, obj: VueObjectData): void;
  onVueObjectExit?(node: VAST.ObjectExpression, obj: VueObjectData): void;
  onSetupFunctionEnter?(
    node: (VAST.FunctionExpression | VAST.ArrowFunctionExpression) & { parent: VAST.Property },
    obj: VueObjectData
  ): void;
  onSetupFunctionExit?(
    node: (VAST.FunctionExpression | VAST.ArrowFunctionExpression) & { parent: VAST.Property },
    obj: VueObjectData
  ): void;
  onRenderFunctionEnter?(
    node: (VAST.FunctionExpression | VAST.ArrowFunctionExpression) & { parent: VAST.Property },
    obj: VueObjectData
  ): void;
  [query: string]:
    | ((node: VAST.ParamNode, obj: VueObjectData) => void)
    | undefined;
}

type ScriptSetupVisitorBase = {
  [T in keyof VAST.NodeListenerMap]?: (node: VAST.NodeListenerMap[T]) => void;
};
export interface ScriptSetupVisitor extends ScriptSetupVisitorBase {
  onDefinePropsEnter?(node: VAST.CallExpression, props: ComponentProp[]): void;
  onDefinePropsExit?(node: VAST.CallExpression, props: ComponentProp[]): void;
  onDefineEmitsEnter?(node: VAST.CallExpression, emits: ComponentEmit[]): void;
  onDefineEmitsExit?(node: VAST.CallExpression, emits: ComponentEmit[]): void;
  [query: string]:
    | ((node: VAST.ParamNode) => void)
    | ((node: VAST.CallExpression, props: ComponentProp[]) => void)
    | ((node: VAST.CallExpression, emits: ComponentEmit[]) => void)
    | undefined;
}

type ComponentArrayPropDetectName = {
  type: "array";
  key: VAST.Literal | VAST.TemplateLiteral;
  propName: string;
  value: null;
  node: VAST.Expression | VAST.SpreadElement;
};
type ComponentArrayPropUnknownName = {
  type: "array";
  key: null;
  propName: null;
  value: null;
  node: VAST.Expression | VAST.SpreadElement;
};
export type ComponentArrayProp =
  | ComponentArrayPropDetectName
  | ComponentArrayPropUnknownName;

type ComponentObjectPropDetectName = {
  type: "object";
  key: VAST.Expression;
  propName: string;
  value: VAST.Expression;
  node: VAST.Property;
};
type ComponentObjectPropUnknownName = {
  type: "object";
  key: null;
  propName: null;
  value: VAST.Expression;
  node: VAST.Property;
};
export type ComponentObjectProp =
  | ComponentObjectPropDetectName
  | ComponentObjectPropUnknownName;

export type ComponentUnknownProp = {
  type: "unknown";
  key: null;
  propName: null;
  value: null;
  node: VAST.Expression | VAST.SpreadElement | null;
};

export type ComponentTypeProp = {
  type: "type";
  key: VAST.Identifier | VAST.Literal;
  propName: string;
  value: null;
  node: VAST.TSPropertySignature | VAST.TSMethodSignature;

  required: boolean;
  types: string[];
};

export type ComponentProp =
  | ComponentArrayProp
  | ComponentObjectProp
  | ComponentTypeProp
  | ComponentUnknownProp;

type ComponentArrayEmitDetectName = {
  type: "array";
  key: VAST.Literal | VAST.TemplateLiteral;
  emitName: string;
  value: null;
  node: VAST.Expression | VAST.SpreadElement;
};
type ComponentArrayEmitUnknownName = {
  type: "array";
  key: null;
  emitName: null;
  value: null;
  node: VAST.Expression | VAST.SpreadElement;
};
export type ComponentArrayEmit =
  | ComponentArrayEmitDetectName
  | ComponentArrayEmitUnknownName;
type ComponentObjectEmitDetectName = {
  type: "object";
  key: VAST.Expression;
  emitName: string;
  value: VAST.Expression;
  node: VAST.Property;
};
type ComponentObjectEmitUnknownName = {
  type: "object";
  key: null;
  emitName: null;
  value: VAST.Expression;
  node: VAST.Property;
};

export type ComponentObjectEmit =
  | ComponentObjectEmitDetectName
  | ComponentObjectEmitUnknownName;

export type ComponentUnknownEmit = {
  type: "unknown";
  key: null;
  emitName: null;
  value: null;
  node: VAST.Expression | VAST.SpreadElement | null;
};

export type ComponentTypeEmit = {
  type: "type";
  key: VAST.TSLiteralType;
  emitName: string;
  value: null;
  node: VAST.TSCallSignatureDeclaration | VAST.TSFunctionType;
};

export type ComponentEmit =
  | ComponentArrayEmit
  | ComponentObjectEmit
  | ComponentTypeEmit
  | ComponentUnknownEmit;
