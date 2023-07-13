import type * as VNODE from "./node";
import type * as VAST from "./ast";
import type * as eslint from "eslint";

type TemplateListenerBase = {
  [T in keyof VAST.VNodeListenerMap]?: (node: VAST.VNodeListenerMap[T]) => void;
};
export interface TemplateListener extends TemplateListenerBase {
  [key: string]: ((node: VAST.ParamNode) => void) | undefined;
}

export interface ParserServices {
  getTemplateBodyTokenStore: () => ParserServices.TokenStore;
  defineTemplateBodyVisitor?: (
    templateBodyVisitor: TemplateListener,
    scriptVisitor?: eslint.Rule.RuleListener,
    options?: {
      templateBodyTriggerSelector: "Program" | "Program:exit";
    }
  ) => eslint.Rule.RuleListener;
  defineDocumentVisitor?: (
    documentVisitor: TemplateListener,
    options?: {
      triggerSelector: "Program" | "Program:exit";
    }
  ) => eslint.Rule.RuleListener;
  getDocumentFragment?: () => VAST.VDocumentFragment | null;
}
export namespace ParserServices {
  export interface TokenStore {
    getTokenByRangeStart(
      offset: number,
      options?: { includeComments: boolean }
    ): VNODE.Token | null;
    getFirstToken(node: VNODE.HasLocation): VNODE.Token;
    getFirstToken(node: VNODE.HasLocation, options: number): VNODE.Token;
    getFirstToken(
      node: VNODE.HasLocation,
      options: eslint.SourceCode.UnaryCursorWithSkipOptions
    ): VNODE.Token | null;
    getLastToken(node: VNODE.HasLocation): VNODE.Token;
    getLastToken(node: VNODE.HasLocation, options: number): VNODE.Token;
    getLastToken(
      node: VNODE.HasLocation,
      options: eslint.SourceCode.UnaryCursorWithSkipOptions
    ): VNODE.Token | null;
    getTokenBefore(node: VNODE.HasLocation): VNODE.Token;
    getTokenBefore(node: VNODE.HasLocation, options: number): VNODE.Token;
    getTokenBefore(
      node: VNODE.HasLocation,
      options: { includeComments: boolean }
    ): VNODE.Token;
    getTokenBefore(
      node: VNODE.HasLocation,
      options: eslint.SourceCode.UnaryCursorWithSkipOptions
    ): VNODE.Token | null;
    getTokenAfter(node: VNODE.HasLocation): VNODE.Token;
    getTokenAfter(node: VNODE.HasLocation, options: number): VNODE.Token;
    getTokenAfter(
      node: VNODE.HasLocation,
      options: { includeComments: boolean }
    ): VNODE.Token;
    getTokenAfter(
      node: VNODE.HasLocation,
      options: eslint.SourceCode.UnaryCursorWithSkipOptions
    ): VNODE.Token | null;
    getFirstTokenBetween(
      left: VNODE.HasLocation,
      right: VNODE.HasLocation,
      options?: eslint.SourceCode.UnaryCursorWithSkipOptions
    ): VNODE.Token | null;
    getLastTokenBetween(
      left: VNODE.HasLocation,
      right: VNODE.HasLocation,
      options?: eslint.SourceCode.UnaryCursorWithSkipOptions
    ): VNODE.Token | null;
    getTokenOrCommentBefore(
      node: VNODE.HasLocation,
      skip?: number
    ): VNODE.Token | null;
    getTokenOrCommentAfter(
      node: VNODE.HasLocation,
      skip?: number
    ): VNODE.Token | null;
    getFirstTokens(
      node: VNODE.HasLocation,
      options?: eslint.SourceCode.BinaryCursorWithCountOptions
    ): VNODE.Token[];
    getLastTokens(
      node: VNODE.HasLocation,
      options?: eslint.SourceCode.BinaryCursorWithCountOptions
    ): VNODE.Token[];
    getTokensBefore(
      node: VNODE.HasLocation,
      options?: eslint.SourceCode.BinaryCursorWithCountOptions
    ): VNODE.Token[];
    getTokensAfter(
      node: VNODE.HasLocation,
      options?: eslint.SourceCode.BinaryCursorWithCountOptions
    ): VNODE.Token[];
    getFirstTokensBetween(
      left: VNODE.HasLocation,
      right: VNODE.HasLocation,
      options?: eslint.SourceCode.BinaryCursorWithCountOptions
    ): VNODE.Token[];
    getLastTokensBetween(
      left: VNODE.HasLocation,
      right: VNODE.HasLocation,
      options?: eslint.SourceCode.BinaryCursorWithCountOptions
    ): VNODE.Token[];
    getTokens(
      node: VNODE.HasLocation,
      beforeCount?: eslint.SourceCode.BinaryCursorWithCountOptions,
      afterCount?: number
    ): VNODE.Token[];
    getTokensBetween(
      left: VNODE.HasLocation,
      right: VNODE.HasLocation,
      padding?: eslint.SourceCode.BinaryCursorWithCountOptions
    ): VNODE.Token[];
    commentsExistBetween(
      left: VNODE.HasLocation,
      right: VNODE.HasLocation
    ): boolean;
    getCommentsBefore(nodeOrToken: VNODE.HasLocation): VNODE.Comment[];
    getCommentsAfter(nodeOrToken: VNODE.HasLocation): VNODE.Comment[];
    getCommentsInside(node: VNODE.HasLocation): VNODE.Comment[];
  }
}
