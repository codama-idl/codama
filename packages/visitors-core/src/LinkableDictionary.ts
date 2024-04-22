import {
    AccountLinkNode,
    AccountNode,
    DefinedTypeLinkNode,
    DefinedTypeNode,
    isNode,
    LinkNode,
    PdaLinkNode,
    PdaNode,
    ProgramLinkNode,
    ProgramNode,
} from '@kinobi-so/nodes';

export type LinkableNode = AccountNode | DefinedTypeNode | PdaNode | ProgramNode;

export class LinkableDictionary {
    private readonly programs: Map<string, ProgramNode> = new Map();

    private readonly pdas: Map<string, PdaNode> = new Map();

    private readonly accounts: Map<string, AccountNode> = new Map();

    private readonly definedTypes: Map<string, DefinedTypeNode> = new Map();

    record(node: LinkableNode): this {
        if (isNode(node, 'programNode')) {
            this.programs.set(node.name, node);
        }
        if (isNode(node, 'pdaNode')) {
            this.pdas.set(node.name, node);
        }
        if (isNode(node, 'accountNode')) {
            this.accounts.set(node.name, node);
        }
        if (isNode(node, 'definedTypeNode')) {
            this.definedTypes.set(node.name, node);
        }
        return this;
    }

    recordAll(nodes: LinkableNode[]): this {
        nodes.forEach(node => this.record(node));
        return this;
    }

    get(linkNode: ProgramLinkNode): ProgramNode | undefined;
    get(linkNode: PdaLinkNode): PdaNode | undefined;
    get(linkNode: AccountLinkNode): AccountNode | undefined;
    get(linkNode: DefinedTypeLinkNode): DefinedTypeNode | undefined;
    get(linkNode: LinkNode): LinkableNode | undefined {
        if (linkNode.importFrom) {
            return undefined;
        }
        if (isNode(linkNode, 'programLinkNode')) {
            return this.programs.get(linkNode.name);
        }
        if (isNode(linkNode, 'pdaLinkNode')) {
            return this.pdas.get(linkNode.name);
        }
        if (isNode(linkNode, 'accountLinkNode')) {
            return this.accounts.get(linkNode.name);
        }
        if (isNode(linkNode, 'definedTypeLinkNode')) {
            return this.definedTypes.get(linkNode.name);
        }
        return undefined;
    }

    has(linkNode: LinkNode): boolean {
        if (linkNode.importFrom) {
            return false;
        }
        if (isNode(linkNode, 'programLinkNode')) {
            return this.programs.has(linkNode.name);
        }
        if (isNode(linkNode, 'pdaLinkNode')) {
            return this.pdas.has(linkNode.name);
        }
        if (isNode(linkNode, 'accountLinkNode')) {
            return this.accounts.has(linkNode.name);
        }
        if (isNode(linkNode, 'definedTypeLinkNode')) {
            return this.definedTypes.has(linkNode.name);
        }
        return false;
    }
}
