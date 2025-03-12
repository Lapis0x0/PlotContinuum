declare module 'turndown' {
  interface TurndownOptions {
    headingStyle?: 'setext' | 'atx';
    hr?: string;
    bulletListMarker?: string;
    codeBlockStyle?: 'indented' | 'fenced';
    fence?: string;
    emDelimiter?: string;
    strongDelimiter?: string;
    linkStyle?: 'inlined' | 'referenced';
    linkReferenceStyle?: 'full' | 'collapsed' | 'shortcut';
    preformattedCode?: boolean;
  }

  type FilterFunction = (node: HTMLElement) => boolean;
  type Filter = string | string[] | FilterFunction;
  type ReplacementFunction = (content: string, node: HTMLElement) => string;

  interface Rule {
    filter: Filter;
    replacement: ReplacementFunction;
  }

  class TurndownService {
    constructor(options?: TurndownOptions);
    addRule(key: string, rule: Rule): this;
    keep(filter: Filter): this;
    remove(filter: Filter): this;
    escape(str: string): string;
    turndown(html: string | HTMLElement): string;
  }

  export = TurndownService;
}
