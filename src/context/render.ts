import type * as ESTree from "estree";
import type { ScopeManager, Scope } from "eslint-scope";
import type {
  Comment,
  SvelteEachBlock,
  SvelteElement,
  SvelteElseBlockAlone,
  SvelteElseBlockElseIf,
  SvelteIfBlock,
  SvelteIfBlockElseIf,
  SvelteName,
  SvelteNode,
  SvelteSnippetBlock,
  Token,
} from "../ast";

type Children = SvelteElement["children"];

enum RenderPartType {
  real,
  virtual,
}

type RenderPart =
  | { code: string; type: RenderPartType.virtual }
  | { code: string; type: RenderPartType.real; node: SvelteNode | ESTree.Node };

export class SvelteRenderContext {
  private readonly code: string;

  private readonly parts: RenderPart[] = [];

  public constructor(code: string) {
    this.code = code;
  }

  public nestIfBlock(ifBlock: SvelteIfBlock | SvelteIfBlockElseIf): void {
    this.wrapInTemplateExpression(() => {
      this.appendNode(ifBlock.expression);
      this.appendVirtualFragment("?");
      this.appendChildren(ifBlock.children);
      this.appendVirtualFragment(":");
      if (ifBlock.else) {
        if (ifBlock.else.elseif) {
          this.nestIfBlock(ifBlock.else.children[0]);
        } else {
          this.appendChildren(ifBlock.else.children);
        }
      } else {
        this.appendVirtualFragment("``");
      }
    });
  }

  private appendChildren(children: Children) {
    if (children.length === 0) this.appendVirtualFragment("");
    if (children.length === 1) this.appendChild(children[0]);

    this.wrapInTemplateString(() => {
      children.map((child) =>
        this.wrapInTemplateExpression(() => this.appendChild(child)),
      );
    });
  }

  private appendChild(_child: SvelteNode | ESTree.Node) {
    // TODO
  }

  private nestEachBlock(eachBlock: SvelteEachBlock) {
    if (eachBlock.else) {
      // TODO: {array}.length
      this.appendVirtualFragment("?");
    }
    // TODO: array
    this.appendVirtualFragment(".map(");
    // TODO: params, and key expression
    this.appendVirtualFragment("=>");
    this.appendChildren(eachBlock.children);
    this.appendVirtualFragment(")");

    if (eachBlock.else) {
      this.appendVirtualFragment(":");
      this.appendChildren(eachBlock.else.children);
    }
  }

  private wrapInTemplateString(callback: () => void) {
    this.appendVirtualFragment("`");
    callback();
    this.appendVirtualFragment("`");
  }

  private appendNode(node: SvelteNode | ESTree.Node) {
    this.parts.push({
      code: this.code.slice(...node.range!),
      type: RenderPartType.Real,
      node,
    });
  }

  private wrapInTemplateExpression(callback: () => void) {
    this.appendVirtualFragment("${");
    callback();
    this.appendVirtualFragment("}");
  }

  private appendVirtualFragment(str: string) {
    this.parts.push({ code: str, type: RenderPartType.Virtual });
  }
}
