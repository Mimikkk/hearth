import { Node } from './Node.js';

export class NodeKeywords {
  keywords: string[];
  nodes: Record<string, any>;
  callbacks: Record<string, any>;

  constructor() {
    this.keywords = [];
    this.nodes = [];
    this.callbacks = {};
  }

  getNode(name: string): Node {
    let node = this.nodes[name];

    if (node === undefined && this.callbacks[name] !== undefined) {
      node = this.callbacks[name](name);

      this.nodes[name] = node;
    }

    return node;
  }

  parse(code) {
    const keywords = this.keywords;

    const regExp = new RegExp(`\\b${keywords.join('\\b|\\b')}\\b`, 'g');

    const codeKeywords = code.match(regExp);

    const keywordNodes = [];

    if (codeKeywords) {
      for (const keyword of codeKeywords) {
        const node = this.getNode(keyword);

        if (node && keywordNodes.indexOf(node) === -1) keywordNodes.push(node);
      }
    }

    return keywordNodes;
  }
}
